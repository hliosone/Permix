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
 * @param credential - Optional credential to present (single credential object)
 */

/**
 * Get domain ID from ledger objects after domain creation
 * Helper function to get actual domain ID from transaction result
 * Based on working pattern from domainswork.ts
 * 
 * @param client - XRPL client
 * @param ownerAddress - Address that created the domain
 * @param sequence - Sequence number of the domain creation transaction
 */
export async function getDomainId(
  client: Client,
  ownerAddress: string,
  sequence: number
): Promise<string | null> {
  try {
    const accountObjects = await client.request({
      command: 'account_objects',
      account: ownerAddress,
      ledger_index: 'validated',
      type: 'permissioned_domain',
    });

    // Find the domain that matches the sequence
    const domain = (accountObjects.result as any).account_objects?.find(
      (obj: any) => obj.Sequence === sequence
    );

    if (domain && domain.index) {
      return domain.index;
    }

    return null;
  } catch (error) {
    console.log(`Error fetching domain ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

/**
 * Get domain information from XRPL
 * Queries the ledger for domain data
 * 
 * @param client - XRPL client
 * @param ownerAddress - Address that owns the domain
 */
export async function getDomainInfo(
  client: Client,
  ownerAddress: string
): Promise<{
  success: boolean;
  domains?: any[];
  error?: string;
}> {
  try {
    // Query account_objects for domain data
    const accountObjects = await client.request({
      command: 'account_objects',
      account: ownerAddress,
      ledger_index: 'validated',
      type: 'permissioned_domain',
    });

    const result = accountObjects.result as any;
    const domains = result.account_objects || [];

    if (domains && domains.length > 0) {
      return {
        success: true,
        domains: domains,
      };
    }

    return {
      success: false,
      error: 'No domains found',
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
