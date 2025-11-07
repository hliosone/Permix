import { Client, OfferCreate, OfferCancel, Wallet } from 'xrpl';

/**
 * Permissioned DEX implementation (XLS-0081)
 * Actual implementation using XRPL transactions
 * Returns prepared transaction payloads ready to be signed and submitted
 * Integrates with permissioned domains to create a controlled trading environment
 */

/**
 * Check if an account is a member of a domain
 * Queries the domain membership from XRPL
 * 
 * @param client - XRPL client
 * @param domainId - Domain ID
 * @param address - Account address to check
 */
async function isDomainMember(
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

/**
 * Get KYC Issuer wallet from environment variables
 * Used for testing and initialization
 */
export function getKYCIssuerWallet(): Wallet | null {
  try {
    const env = (import.meta as any).env as { VITE_KYC_ISSUER_SEED?: string };
    const seed = env.VITE_KYC_ISSUER_SEED;
    if (!seed) {
      console.warn('VITE_KYC_ISSUER_SEED not found in environment variables');
      return null;
    }
    return Wallet.fromSeed(seed);
  } catch (error) {
    console.error('Error creating KYC Issuer wallet:', error);
    return null;
  }
}

/**
 * Get KYC User wallet from environment variables
 * Used for testing and initialization
 */
export function getKYCUserWallet(): Wallet | null {
  try {
    const env = (import.meta as any).env as { VITE_KYC_USER_SEED?: string };
    const seed = env.VITE_KYC_USER_SEED;
    if (!seed) {
      console.warn('VITE_KYC_USER_SEED not found in environment variables');
      return null;
    }
    return Wallet.fromSeed(seed);
  } catch (error) {
    console.error('Error creating KYC User wallet:', error);
    return null;
  }
}

/**
 * Initialize permissioned DEX with default wallets from environment
 * Helper function for quick setup and testing
 * 
 * @param client - XRPL client
 * @param dexName - Name for the DEX
 * @param domainId - Domain ID to link the DEX to
 * @param tradingPairs - Trading pairs to support
 */
export async function initializePermissionedDEX(
  client: Client,
  dexName: string,
  domainId: string,
  tradingPairs: TradingPair[]
): Promise<{
  success: boolean;
  transaction?: PermissionedDEXCreate;
  issuerWallet?: Wallet;
  userWallet?: Wallet;
  error?: string;
}> {
  try {
    console.log('=== Initializing Permissioned DEX ===');
    
    // Get wallets from environment
    const issuerWallet = getKYCIssuerWallet();
    const userWallet = getKYCUserWallet();
    
    if (!issuerWallet) {
      return {
        success: false,
        error: 'KYC Issuer wallet not found. Please set VITE_KYC_ISSUER_SEED in .env',
      };
    }
    
    if (!userWallet) {
      return {
        success: false,
        error: 'KYC User wallet not found. Please set VITE_KYC_USER_SEED in .env',
      };
    }
    
    console.log('KYC Issuer Wallet:', issuerWallet.address);
    console.log('KYC User Wallet:', userWallet.address);
    
    // Create the DEX using the issuer wallet
    const dexResult = await createPermissionedDEX(
      client,
      issuerWallet.address,
      {
        dexName,
        domainId,
        tradingPairs,
      }
    );
    
    if (!dexResult.success) {
      return {
        success: false,
        error: dexResult.error || 'Failed to create DEX',
      };
    }
    
    return {
      success: true,
      transaction: dexResult.transaction,
      issuerWallet,
      userWallet,
    };
  } catch (error) {
    console.error('Error initializing permissioned DEX:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export interface TradingPair {
  baseCurrency: string; // IOU token code
  baseIssuer: string; // IOU token issuer
  quoteCurrency: string; // Usually XRP or another IOU
  quoteIssuer?: string; // If quote is an IOU
}

export interface DEXConfig {
  dexName: string;
  domainId: string; // Must be a valid permissioned domain
  tradingPairs: TradingPair[];
  description?: string;
}

// Permissioned DEX transaction types (XLS-0081 spec structure)
export interface PermissionedDEXCreate {
  TransactionType: 'PermissionedDEXCreate';
  Account: string;
  DEXName: string;
  DomainID: string;
  TradingPairs: Array<{
    BaseCurrency: string;
    BaseIssuer: string;
    QuoteCurrency: string;
    QuoteIssuer?: string;
  }>;
  DEXMetadata?: Record<string, any>;
}

/**
 * Create a permissioned DEX
 * Returns prepared transaction payload (ready to be signed and submitted)
 * Based on XLS-0081 specification
 * 
 * @param client - XRPL client
 * @param creatorAddress - Address creating the DEX
 * @param config - DEX configuration
 */
export async function createPermissionedDEX(
  client: Client,
  creatorAddress: string,
  config: DEXConfig
): Promise<{
  success: boolean;
  transaction: PermissionedDEXCreate;
  error?: string;
}> {
  try {
    console.log('=== Preparing Permissioned DEX Creation ===');
    console.log('DEX Name:', config.dexName);
    console.log('Domain ID:', config.domainId);
    console.log('Trading Pairs:', config.tradingPairs);
    console.log('Creator:', creatorAddress);

    // Verify domain exists and creator is a member
    const isMember = await isDomainMember(client, config.domainId, creatorAddress);
    if (!isMember) {
      return {
        success: false,
        transaction: {} as PermissionedDEXCreate,
        error: 'Creator is not a member of the specified domain',
      };
    }

    // Build PermissionedDEXCreate transaction according to XLS-0081 spec
    const dexCreate: PermissionedDEXCreate = {
      TransactionType: 'PermissionedDEXCreate',
      Account: creatorAddress,
      DEXName: config.dexName,
      DomainID: config.domainId,
      TradingPairs: config.tradingPairs.map((pair) => ({
        BaseCurrency: pair.baseCurrency,
        BaseIssuer: pair.baseIssuer,
        QuoteCurrency: pair.quoteCurrency,
        QuoteIssuer: pair.quoteIssuer,
      })),
    };

    if (config.description) {
      dexCreate.DEXMetadata = { description: config.description };
    }

    console.log('PermissionedDEXCreate transaction:', dexCreate);

    // Autofill the transaction
    const prepared = await client.autofill(dexCreate as any);
    console.log('PermissionedDEXCreate transaction prepared:', prepared);

    return {
      success: true,
      transaction: prepared as PermissionedDEXCreate,
    };
  } catch (error) {
    console.error('Error preparing permissioned DEX creation:', error);
    return {
      success: false,
      transaction: {} as PermissionedDEXCreate,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a buy or sell order on the permissioned DEX
 * Returns prepared OfferCreate transaction payload (ready to be signed and submitted)
 * Verifies domain membership before preparing the order
 * Based on XLS-0081 specification
 * 
 * @param client - XRPL client
 * @param accountAddress - Address placing the order
 * @param domainId - Domain ID of the DEX
 * @param pair - Trading pair
 * @param side - 'buy' or 'sell'
 * @param amount - Amount of base currency
 * @param price - Price in quote currency
 */
export async function createDEXOrder(
  client: Client,
  accountAddress: string,
  domainId: string,
  pair: TradingPair,
  side: 'buy' | 'sell',
  amount: string,
  price: string
): Promise<{
  success: boolean;
  transaction: OfferCreate;
  error?: string;
}> {
  try {
    console.log('=== Preparing DEX Order ===');
    console.log('Domain ID:', domainId);
    console.log('Pair:', `${pair.baseCurrency}/${pair.quoteCurrency}`);
    console.log('Side:', side);
    console.log('Amount:', amount);
    console.log('Price:', price);
    console.log('Account:', accountAddress);

    // Verify account is a member of the domain
    const isMember = await isDomainMember(client, domainId, accountAddress);
    if (!isMember) {
      return {
        success: false,
        transaction: {} as OfferCreate,
        error: 'Account is not a member of the DEX domain. Please join the domain first.',
      };
    }

    // Calculate total
    const total = (parseFloat(amount) * parseFloat(price)).toString();

    // Build OfferCreate transaction
    // For buy orders: buying base currency with quote currency
    // For sell orders: selling base currency for quote currency
    let offer: OfferCreate;

    if (side === 'buy') {
      // Buying base currency: TakerGets = base currency, TakerPays = quote currency
      if (pair.quoteCurrency === 'XRP') {
        offer = {
          TransactionType: 'OfferCreate',
          Account: accountAddress,
          TakerGets: {
            currency: pair.baseCurrency,
            issuer: pair.baseIssuer,
            value: amount,
          },
          TakerPays: total, // XRP amount as string
        };
      } else {
        offer = {
          TransactionType: 'OfferCreate',
          Account: accountAddress,
          TakerGets: {
            currency: pair.baseCurrency,
            issuer: pair.baseIssuer,
            value: amount,
          },
          TakerPays: {
            currency: pair.quoteCurrency,
            issuer: pair.quoteIssuer!,
            value: total,
          },
        };
      }
    } else {
      // Selling base currency: TakerGets = quote currency, TakerPays = base currency
      if (pair.quoteCurrency === 'XRP') {
        offer = {
          TransactionType: 'OfferCreate',
          Account: accountAddress,
          TakerGets: total, // XRP amount as string
          TakerPays: {
            currency: pair.baseCurrency,
            issuer: pair.baseIssuer,
            value: amount,
          },
        };
      } else {
        offer = {
          TransactionType: 'OfferCreate',
          Account: accountAddress,
          TakerGets: {
            currency: pair.quoteCurrency,
            issuer: pair.quoteIssuer!,
            value: total,
          },
          TakerPays: {
            currency: pair.baseCurrency,
            issuer: pair.baseIssuer,
            value: amount,
          },
        };
      }
    }

    // Add DomainID field if supported (XLS-0081 extension to OfferCreate)
    // Note: This may not be in xrpl.js types yet, so we'll add it as any
    (offer as any).DomainID = domainId;

    console.log('OfferCreate transaction:', offer);

    // Autofill the transaction
    const prepared = await client.autofill(offer);
    console.log('OfferCreate transaction prepared:', prepared);

    return {
      success: true,
      transaction: prepared,
    };
  } catch (error) {
    console.error('Error preparing DEX order:', error);
    return {
      success: false,
      transaction: {} as OfferCreate,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancel an order on the permissioned DEX
 * Returns prepared OfferCancel transaction payload (ready to be signed and submitted)
 * 
 * @param client - XRPL client
 * @param accountAddress - Address that created the order
 * @param offerSequence - Sequence number of the offer to cancel
 */
export async function cancelDEXOrder(
  client: Client,
  accountAddress: string,
  offerSequence: number
): Promise<{
  success: boolean;
  transaction: OfferCancel;
  error?: string;
}> {
  try {
    console.log('=== Preparing DEX Order Cancellation ===');
    console.log('Account:', accountAddress);
    console.log('Offer Sequence:', offerSequence);

    // Build OfferCancel transaction
    const offerCancel: OfferCancel = {
      TransactionType: 'OfferCancel',
      Account: accountAddress,
      OfferSequence: offerSequence,
    };

    console.log('OfferCancel transaction:', offerCancel);

    // Autofill the transaction
    const prepared = await client.autofill(offerCancel);
    console.log('OfferCancel transaction prepared:', prepared);

    return {
      success: true,
      transaction: prepared,
    };
  } catch (error) {
    console.error('Error preparing order cancellation:', error);
    return {
      success: false,
      transaction: {} as OfferCancel,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get DEX information from XRPL
 * Queries the DEX data from the ledger
 * Note: On devnet, we use account_objects to query DEX data
 * 
 * @param client - XRPL client
 * @param dexId - DEX ID (account address that created the DEX)
 */
export async function getDEXInfo(client: Client, dexId: string): Promise<any> {
  try {
    // On devnet, query account_objects for DEX data
    // The DEX will be stored as a ledger object associated with the creator account
    const response = await client.request({
      command: 'account_objects',
      account: dexId,
      ledger_index: 'validated',
      type: 'dex', // Filter for DEX objects (if supported)
    } as any);
    
    // Type assertion for devnet response
    const result = response.result as any;
    
    // If type filter not supported, get all objects and filter manually
    if (!result.account_objects) {
      const allObjects = await client.request({
        command: 'account_objects',
        account: dexId,
        ledger_index: 'validated',
      });
      
      const allResult = allObjects.result as any;
      
      // Filter for DEX-related objects
      const dexObjects = allResult.account_objects?.filter(
        (obj: any) => obj.LedgerEntryType === 'DEX' || obj.LedgerEntryType === 'PermissionedDEX'
      );
      
      return { account_objects: dexObjects || [] };
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching DEX info:', error);
    throw error;
  }
}

/**
 * Get order book for a trading pair
 * Queries offers from XRPL ledger using book_offers
 * 
 * @param client - XRPL client
 * @param pair - Trading pair
 */
export async function getOrderBook(
  client: Client,
  pair: TradingPair
): Promise<{
  buys: any[];
  sells: any[];
}> {
  try {
    // Query offers for the trading pair
    // book_offers requires taker_gets and taker_pays
    const takerGets = {
      currency: pair.baseCurrency,
      issuer: pair.baseIssuer,
    };
    
    const takerPays = pair.quoteCurrency === 'XRP' 
      ? 'XRP' 
      : {
          currency: pair.quoteCurrency,
          issuer: pair.quoteIssuer!,
        };

    const response = await client.request({
      command: 'book_offers',
      taker_gets: takerGets,
      taker_pays: takerPays,
      ledger_index: 'validated',
    } as any);

    // Type assertion for devnet response
    const result = response.result as any;
    const offers = result.offers || [];
    
    // Separate buys and sells
    // Buys: offers where TakerGets is base currency (buying base with quote)
    // Sells: offers where TakerPays is base currency (selling base for quote)
    const buys: any[] = [];
    const sells: any[] = [];

    for (const offer of offers) {
      const offerTakerGets = offer.TakerGets;
      const offerTakerPays = offer.TakerPays;

      // Determine if it's a buy or sell based on what's being offered
      if (typeof offerTakerGets === 'object' && offerTakerGets.currency === pair.baseCurrency) {
        // TakerGets base currency = buy order (wanting to get base currency)
        buys.push(offer);
      } else if (typeof offerTakerPays === 'object' && offerTakerPays.currency === pair.baseCurrency) {
        // TakerPays base currency = sell order (offering base currency)
        sells.push(offer);
      }
    }

    // Sort buys descending by price (highest bid first), sells ascending by price (lowest ask first)
    buys.sort((a, b) => {
      const getValue = (amount: any): number => {
        if (typeof amount === 'string') return parseFloat(amount);
        return parseFloat(amount.value || '0');
      };
      
      const priceA = getValue(a.TakerPays) / getValue(a.TakerGets);
      const priceB = getValue(b.TakerPays) / getValue(b.TakerGets);
      return priceB - priceA;
    });

    sells.sort((a, b) => {
      const getValue = (amount: any): number => {
        if (typeof amount === 'string') return parseFloat(amount);
        return parseFloat(amount.value || '0');
      };
      
      const priceA = getValue(a.TakerPays) / getValue(a.TakerGets);
      const priceB = getValue(b.TakerPays) / getValue(b.TakerGets);
      return priceA - priceB;
    });

    return { buys, sells };
  } catch (error) {
    console.error('Error fetching order book:', error);
    return { buys: [], sells: [] };
  }
}
