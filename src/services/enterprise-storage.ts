/**
 * Enterprise Storage Service
 * Persists enterprise data (tokens, domains) across sessions using localStorage
 */

export interface EnterpriseToken {
  id: string;
  currency: string;
  issuer: string;
  name: string;
  code: string;
  description: string;
  flags: {
    requireAuth: boolean;
    freeze: boolean;
    clawback: boolean;
  };
  createdAt: string;
  transactionHashes?: string[];
}

export interface EnterpriseDomain {
  id: string;
  domainId: string;
  domainName: string;
  creator: string;
  requiredCredentials?: string[];
  description?: string;
  createdAt: string;
  transactionHash?: string;
}

export interface EnterpriseDEX {
  id: string;
  dexId: string;
  dexName: string;
  domainId: string;
  tradingPairs: Array<{
    baseCurrency: string;
    baseIssuer: string;
    quoteCurrency: string;
    quoteIssuer?: string;
  }>;
  createdAt: string;
  transactionHash?: string;
}

export interface EnterpriseData {
  walletAddress: string;
  companyName: string;
  tokens: EnterpriseToken[];
  domains: EnterpriseDomain[];
  dexes: EnterpriseDEX[];
  createdAt: string;
  lastUpdated: string;
}

const STORAGE_KEY_PREFIX = 'enterprise_';

/**
 * Get storage key for an enterprise
 */
function getStorageKey(walletAddress: string): string {
  return `${STORAGE_KEY_PREFIX}${walletAddress}`;
}

/**
 * Get all enterprise addresses
 */
export function getAllEnterpriseAddresses(): string[] {
  const addresses: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      const address = key.replace(STORAGE_KEY_PREFIX, '');
      addresses.push(address);
    }
  }
  return addresses;
}

/**
 * Get enterprise data
 */
export function getEnterpriseData(walletAddress: string): EnterpriseData | null {
  try {
    const key = getStorageKey(walletAddress);
    const stored = localStorage.getItem(key);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as EnterpriseData;
  } catch (error) {
    console.error('Error loading enterprise data:', error);
    return null;
  }
}

/**
 * Initialize or get enterprise data
 */
export function initializeEnterprise(
  walletAddress: string,
  companyName: string
): EnterpriseData {
  const existing = getEnterpriseData(walletAddress);
  if (existing) {
    return existing;
  }

  const newEnterprise: EnterpriseData = {
    walletAddress,
    companyName,
    tokens: [],
    domains: [],
    dexes: [],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  saveEnterpriseData(newEnterprise);
  return newEnterprise;
}

/**
 * Save enterprise data
 */
export function saveEnterpriseData(data: EnterpriseData): void {
  try {
    const key = getStorageKey(data.walletAddress);
    const updated = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving enterprise data:', error);
  }
}

/**
 * Add a token to enterprise data
 */
export function addEnterpriseToken(
  walletAddress: string,
  token: Omit<EnterpriseToken, 'id' | 'createdAt'>
): EnterpriseToken {
  const enterprise = getEnterpriseData(walletAddress);
  if (!enterprise) {
    throw new Error('Enterprise not found');
  }

  const newToken: EnterpriseToken = {
    ...token,
    id: `token_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    createdAt: new Date().toISOString(),
  };

  enterprise.tokens.push(newToken);
  saveEnterpriseData(enterprise);

  return newToken;
}

/**
 * Add a domain to enterprise data
 */
export function addEnterpriseDomain(
  walletAddress: string,
  domain: Omit<EnterpriseDomain, 'id' | 'createdAt'>
): EnterpriseDomain {
  const enterprise = getEnterpriseData(walletAddress);
  if (!enterprise) {
    throw new Error('Enterprise not found');
  }

  const newDomain: EnterpriseDomain = {
    ...domain,
    id: `domain_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    createdAt: new Date().toISOString(),
  };

  enterprise.domains.push(newDomain);
  saveEnterpriseData(enterprise);

  return newDomain;
}

/**
 * Add a DEX to enterprise data
 */
export function addEnterpriseDEX(
  walletAddress: string,
  dex: Omit<EnterpriseDEX, 'id' | 'createdAt'>
): EnterpriseDEX {
  const enterprise = getEnterpriseData(walletAddress);
  if (!enterprise) {
    throw new Error('Enterprise not found');
  }

  const newDEX: EnterpriseDEX = {
    ...dex,
    id: `dex_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    createdAt: new Date().toISOString(),
  };

  enterprise.dexes.push(newDEX);
  saveEnterpriseData(enterprise);

  return newDEX;
}

/**
 * Update enterprise company name
 */
export function updateEnterpriseName(
  walletAddress: string,
  companyName: string
): void {
  const enterprise = getEnterpriseData(walletAddress);
  if (!enterprise) {
    throw new Error('Enterprise not found');
  }

  enterprise.companyName = companyName;
  saveEnterpriseData(enterprise);
}

/**
 * Get all enterprises
 */
export function getAllEnterprises(): EnterpriseData[] {
  const addresses = getAllEnterpriseAddresses();
  return addresses
    .map((address) => getEnterpriseData(address))
    .filter((data): data is EnterpriseData => data !== null);
}

/**
 * Delete enterprise data
 */
export function deleteEnterpriseData(walletAddress: string): void {
  try {
    const key = getStorageKey(walletAddress);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error deleting enterprise data:', error);
  }
}

