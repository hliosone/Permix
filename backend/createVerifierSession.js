
const VERIFIER_BASE = "https://verifier-backend.eudiw.dev";

/**
 * Construit l'objet de requête pour le Verifier (DCQL-like simple).
 * attributes: ex { "age_equal_or_over": 18, "address.country": "FR", "nationality": "FR" }
 */
function buildPresentationBody(attributes = {}) {
    return {
        type: "vp_token",
        jar_mode: "by_reference",
        request_uri_method: "get",
        response_mode: "direct_post.jwt",
        // Requête DCQL minimale (un seul credential)
        dcql_query: {
            credentials: [
                {
                    id: "query_0",
                    format: "dc+sd-jwt",
                    meta: { vct_values: ["urn:eudi:pid:1"] },
                    claims: Object.entries(attributes).map(([path, value]) => {
                        // supporte "address.country" en path array
                        const pathArray = path.split(".");
                        // value optionnelle (certains attributs sont bool/présence)
                        return value !== undefined
                            ? { path: pathArray, value: String(value) }
                            : { path: pathArray };
                    })
                }
            ]
        },
        credential_sets: [
            {
                id: "set_1",
                options: [{ credential_id: "query_0" }],
                purpose: "Access to XRPL permissioned domain"
            }
        ],
        // un petit nonce statique/à remplacer
        nonce: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now())
    };
}

/**
 * 1) Crée une session et renvoie transaction_id + request_uri (pour générer TON QR côté front).
 * Recommandé: un seul transaction_id et tu fais le QR local (qrcode.react, qrcode.js, etc.).
 */
export async function createVerifierSession(attributes = {}) {
    const body = buildPresentationBody(attributes);

    const res = await fetch(`${VERIFIER_BASE}/ui/presentations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Verifier API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    // { transaction_id, client_id, request_uri, request_uri_method }
    return {
        transaction_id: data.transaction_id,
        request_uri: data.request_uri,
        request_uri_method: data.request_uri_method
    };
}


// Poll le statut de la présentation jusqu'à success/failed ou timeout.
// options: { intervalMs: 1500, timeoutMs: 120000 }
export async function pollPresentationStatus(transaction_id, options = {}) {
    const { intervalMs = 1500, timeoutMs = 120000 } = options;
    const start = Date.now();

    while (true) {
        const res = await fetch(
            `https://verifier-backend.eudiw.dev/ui/presentations/${encodeURIComponent(transaction_id)}`,
            { method: "GET" }
        );

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Verifier status error ${res.status}: ${text}`);
        }

        // Quand la présentation n'existe pas encore ou n'a rien renvoyé,
        // certains backends peuvent retourner 200 avec un body vide → sécurise:
        let data = null;
        try { data = await res.json(); } catch (_) { /* pas encore de body JSON */ }

        if (data && typeof data.status === "string") {
            if (data.status === "success") return data;    // contient les claims validés
            if (data.status === "failed")  throw new Error("Presentation failed");
            // sinon pending → on continue
        }

        if (Date.now() - start > timeoutMs) {
            throw new Error("Presentation polling timed out");
        }
        await new Promise(r => setTimeout(r, intervalMs));
    }
}