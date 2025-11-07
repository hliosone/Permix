import { Client } from 'xrpl';

/**
 * Permissioned Domains implementation (XLS-0080)
 * Actual implementation using XRPL transactions
 * Returns prepared transaction payloads ready to be signed and submitted
 */

/**
 * Domain configuration interface
 */
export interface DomainConfig {
  domainName?: string; // Optional, for reference only
  acceptedCredentials?: Array<{
    Credential: {
      Issuer: string;
      CredentialType: string; // Hex-encoded credential type
    };
  }>;
  description?: string; // Optional, for reference only
}

/**
 * PermissionedDomainSet transaction type (XLS-0080 spec structure)
 * Based on working pattern from domainswork.ts
 */
export interface PermissionedDomainSet {
  TransactionType: 'PermissionedDomainSet';
  Account: string;
  AcceptedCredentials?: Array<{
    Credential: {
      Issuer: string;
      CredentialType: string; // Hex-encoded
    };
  }>;
}

/**
 * DomainJoin transaction type (XLS-0080 spec structure)
 */
export interface DomainJoin {
  TransactionType: 'DomainJoin';
  Account: string;
  DomainID: string;
  Credentials?: string[];
}

/**
 * Create a permissioned domain
 * Returns prepared transaction payload (ready to be signed and submitted)
 * Based on XLS-0080 specification using PermissionedDomainSet transaction
 * Following working pattern from domainswork.ts
 * 
 * @param client - XRPL client
 * @param creatorAddress - Address creating the domain
 * @param config - Domain configuration
 */
export async function createPermissionedDomain(
  client: Client,
  creatorAddress: string,
  config: DomainConfig
): Promise<{
  success: boolean;
  transaction?: PermissionedDomainSet;
  error?: string;
}> {
  try {
    console.log('=== Preparing Permissioned Domain Creation ===');
    console.log('Domain Name:', config.domainName || 'N/A');
    console.log('Accepted Credentials:', config.acceptedCredentials);
    console.log('Creator:', creatorAddress);

    // Build PermissionedDomainSet transaction following working pattern
    const domainSet: PermissionedDomainSet = {
      TransactionType: 'PermissionedDomainSet',
      Account: creatorAddress,
    };

    // Add accepted credentials if provided
    if (config.acceptedCredentials && config.acceptedCredentials.length > 0) {
      domainSet.AcceptedCredentials = config.acceptedCredentials;
    }

    console.log('PermissionedDomainSet transaction:', domainSet);

    // Autofill the transaction
    const prepared = await client.autofill(domainSet as any);
    console.log('PermissionedDomainSet transaction prepared:', prepared);

    return {
      success: true,
      transaction: prepared as PermissionedDomainSet,
    };
  } catch (error) {
    console.error('Error preparing permissioned domain creation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Join a permissioned domain
 * Returns prepared transaction payload (ready to be signed and submitted)
 * Based on XLS-0080 specification
 * 
 * @param client - XRPL client
 * @param memberAddress - Address joining the domain
 * @param domainId - Domain ID to join
 * @param credentials - Optional credentials to present
 */
export async function joinPermissionedDomain(
  client: Client,
  memberAddress: string,
  domainId: string,
  credentials?: string[]
): Promise<{
  success: boolean;
  transaction?: DomainJoin;
  error?: string;
}> {
  try {
    console.log('=== Preparing Domain Join ===');
    console.log('Domain ID:', domainId);
    console.log('Member:', memberAddress);
    console.log('Credentials:', credentials);

    // Build DomainJoin transaction according to XLS-0080 spec
    const domainJoin: DomainJoin = {
      TransactionType: 'DomainJoin',
      Account: memberAddress,
      DomainID: domainId,
    };

    if (credentials && credentials.length > 0) {
      domainJoin.Credentials = credentials;
    }

    console.log('DomainJoin transaction:', domainJoin);

    // Autofill the transaction
    const prepared = await client.autofill(domainJoin as any);
    console.log('DomainJoin transaction prepared:', prepared);

    return {
      success: true,
      transaction: prepared as DomainJoin,
    };
  } catch (error) {
    console.error('Error preparing domain join:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get domain information from XRPL
 * Queries the ledger for domain data
 * 
 * @param client - XRPL client
 * @param domainId - Domain ID to query
 */
export async function getDomainInfo(
  client: Client,
  domainId: string
): Promise<{
  success: boolean;
  domain?: any;
  error?: string;
}> {
  try {
    // Query account_objects for domain data
    // Note: Domain data structure may vary on devnet
    const accountObjects = await client.request({
      command: 'account_objects',
      account: domainId, // Domain ID might be an account or ledger object
      ledger_index: 'validated',
    });

    const result = accountObjects.result as any;
    const domains = result.account_objects?.filter(
      (obj: any) => obj.LedgerEntryType === 'Domain' || obj.DomainID === domainId
    );

    if (domains && domains.length > 0) {
      return {
        success: true,
        domain: domains[0],
      };
    }

    return {
      success: false,
      error: 'Domain not found',
    };
  } catch (error) {
    console.error('Error fetching domain info:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if an account is a member of a domain
 * Queries the domain membership from XRPL
 * 
 * @param client - XRPL client
 * @param domainId - Domain ID
 * @param address - Account address to check
 */
export async function isDomainMember(
  client: Client,
  domainId: string,
  address: string
): Promise<boolean> {
  try {
    // Query account_objects for domain membership
    const accountObjects = await client.request({
      command: 'account_objects',
      account: address,
      ledger_index: 'validated',
    });

    const result = accountObjects.result as any;
    const domainMemberships = result.account_objects?.filter(
      (obj: any) => obj.LedgerEntryType === 'DomainMembership' && obj.DomainID === domainId
    );

    return domainMemberships && domainMemberships.length > 0;
  } catch (error) {
    console.error('Error checking domain membership:', error);
    return false;
  }
}
