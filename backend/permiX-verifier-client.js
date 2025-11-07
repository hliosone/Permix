/**
 * PermiX Verifier Client (vanilla JS)
 * Minimal utilities to:
 *  1) Build a presentation definition (choose attributes)
 *  2) Create a verification (POST)
 *  3) Render the QR code
 *  4) Poll verification state until DONE
 *
 * Assumes a global `QRCode` constructor is available (cdnjs "qrcodejs").
 * If not present, the QR rendering function will throw with a clear message.
 *
 * Usage example (browser):
 *   const attrs = { familyName: true, givenName: true, ageOver18: true, nationalities: true };
 *   const { id, verification_url } = await PermiXVerifier.createVerification(attrs);
 *   PermiXVerifier.renderQrCode('#qrcode', verification_url);
 *   const final = await PermiXVerifier.pollVerification(id, { onUpdate: s => console.log('state=', s) });
 *   PermiXVerifier.renderResult('#qrcode', final);
 */
(function (global) {
  const BASE_URL = 'https://beta-verifier.edel-id.ch/management/api/verifications';

  /** Build input_descriptors.fields from selected attributes */
  function buildFields({ familyName, givenName, ageOver18, nationalities }) {
    const fields = [];

    if (familyName) {
      fields.push({
        id: 'family_name',
        name: 'Family name',
        purpose: 'Provide your family name.',
        path: ['$.family_name'],
        filter: null
      });
    }
    if (givenName) {
      fields.push({
        id: 'given_name',
        name: 'Given name',
        purpose: 'Provide your given name.',
        path: ['$.given_name'],
        filter: null
      });
    }
    if (ageOver18) {
      fields.push({
        id: 'age_over_18',
        name: 'Age over 18',
        purpose: 'Prove that you are over 18.',
        path: ['$.age_over_18'],
        filter: null
      });
    }
  /*  if (nationalities) {
      fields.push({
        id: 'nationalities',
        name: 'Nationalities',
        purpose: 'Provide your nationalities.',
        path: ['$.nationalities'],
        filter: null
      });
    }*/

      if (nationalities) {
          fields.push({
              id: 'issuing_country',
              name: 'Issuing Country',
              purpose: 'Provide the issuing country.',
              path: [
                  '$.issuing_country'
              ],
              filter: null
          });
      }

    // Always assert credential type (vct) = "betaid-sdjwt"
    fields.push({
      id: 'vct',
      name: 'VC Type',
      purpose: 'Ensure correct VC type.',
      path: ['$.vct'],
      filter: { type: 'string', const: 'betaid-sdjwt' }
    });

    return fields;
  }

  /** Build full payload for the verifier API */
  function buildPayload(attributeSelection, acceptedIssuerDids = []) {
    const fields = buildFields(attributeSelection);

    return {
      accepted_issuer_dids: acceptedIssuerDids,
      presentation_definition: {
        id: '00000000-0000-0000-0000-000000000000',
        input_descriptors: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            format: {
              'vc+sd-jwt': {
                'sd-jwt_alg_values': ['ES256'],
                'kb-jwt_alg_values': ['ES256']
              }
            },
            constraints: {
              fields,
              limit_disclosure: null,
              format: {}
            }
          }
        ]
      }
    };
  }

  /** Generic fetch with timeout */
  async function fetchJSON(url, options = {}, { timeoutMs = 20000 } = {}) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} – ${res.statusText}: ${text}`);
      }
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  }

  /** Step 1: create verification and get { id, verification_url } */
  async function createVerification(attributeSelection, acceptedIssuerDids = []) {
    const payload = buildPayload(attributeSelection, acceptedIssuerDids);
    return await fetchJSON(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  /** Step 2: render QR code into a container (selector or element) */
  function renderQrCode(target, qrText, { width = 256, height = 256 } = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) throw new Error('renderQrCode: target element not found.');
    el.innerHTML = '';

    if (typeof QRCode !== 'function') {
      throw new Error('renderQrCode: QRCode library not found. Include qrcodejs (e.g., cdnjs qrcodejs).');
    }

    // eslint-disable-next-line no-new
    new QRCode(el, { text: qrText, width, height });
  }

  /** Step 3a: get verification by ID once */
  async function getVerification(verificationId) {
    if (!verificationId) throw new Error('getVerification: verificationId is required');
    const url = `${BASE_URL}/${encodeURIComponent(verificationId)}`;
    return await fetchJSON(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
  }

  /** Step 3b: poll until terminal state (SUCCESS / FAILED / CANCELLED / EXPIRED / etc.) */
  async function pollVerification(
    verificationId,
    {
      intervalMs = 2000,
      maxTimeMs = 5 * 60 * 1000,
      onUpdate = null // (stateObj) => void
    } = {}
  ) {
    const start = Date.now();
    // initial read
    let data = await getVerification(verificationId);
    if (onUpdate) onUpdate(data);

    while (data.state === 'PENDING') {
      if (Date.now() - start > maxTimeMs) {
        throw new Error('Polling timeout exceeded.');
      }
      await new Promise(r => setTimeout(r, intervalMs));
      data = await getVerification(verificationId);
      if (onUpdate) onUpdate(data);
    }
    return data;
  }

  /** Render a simple result view into a container */
  function renderResult(target, verificationData) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) throw new Error('renderResult: target element not found.');

    const { state, wallet_response } = verificationData || {};
    let html = `<div><strong>Verification state:</strong> ${state || 'UNKNOWN'}</div>`;

    if (state === 'SUCCESS' && wallet_response && wallet_response.credential_subject_data) {
      const csd = wallet_response.credential_subject_data;
      const over18 = csd.age_over_18 === 'true' || csd.age_over_18 === true ? '✅' : '❌';
      const fam = csd.family_name ? String(csd.family_name) : '';
      const given = csd.given_name ? String(csd.given_name) : '';
      const nats = Array.isArray(csd.nationalities)
        ? csd.nationalities.join(', ')
        : (csd.nationalities || '');

      html += '<ul style="margin-top:8px;line-height:1.6">';
      if (fam) html += `<li><strong>Family Name:</strong> ${escapeHtml(fam)}</li>`;
      if (given) html += `<li><strong>Given Name:</strong> ${escapeHtml(given)}</li>`;
      html += `<li><strong>Is over 18?</strong> ${over18}</li>`;
      if (nats) html += `<li><strong>Nationalities:</strong> ${escapeHtml(nats)}</li>`;
      html += '</ul>';
    }

    el.innerHTML = html;
  }

  /** Tiny HTML escaper */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Public API
  const api = {
    buildPayload,
    createVerification,
    renderQrCode,
    getVerification,
    pollVerification,
    renderResult
  };

  // UMD-style export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.PermiXVerifier = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
