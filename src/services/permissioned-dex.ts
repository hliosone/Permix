import { Client, OfferCreate, OfferCancel } from 'xrpl';

/**
 * Permissioned DEX implementation (XLS-0081)
 * Actual implementation using XRPL transactions
 * Returns prepared transaction payloads ready to be signed and submitted
 * Integrates with permissioned domains to create a controlled trading environment
 */

/**
 * Trading pair interface
 */
export interface TradingPair {
  baseCurrency: string; // IOU token code or 'XRP'
  baseIssuer?: string; // IOU token issuer (undefined for XRP)
  quoteCurrency: string; // Usually XRP or another IOU
  quoteIssuer?: string; // If quote is an IOU (undefined for XRP)
}

/**
 * Extended OfferCreate interface with DomainID support (XLS-0081)
 */
export interface PermissionedOfferCreate extends OfferCreate {
  DomainID?: string; // Hash256 - The domain that the offer must be a part of
}

/**
 * Create a permissioned DEX order (OfferCreate with DomainID)
 * Returns prepared transaction payload (ready to be signed and submitted)
 * Based on XLS-0081 specification
 * 
 * Structure matches XLS-0081 spec example:
 * {
 *   TransactionType: "OfferCreate",
 *   Account: accountAddress,
 *   TakerGets: { currency, issuer, value },
 *   TakerPays: { currency, issuer, value },
 *   DomainID: domainId
 * }
 * 
 * @param client - XRPL client
 * @param accountAddress - Address placing the order
 * @param domainId - Domain ID for the permissioned orderbook
 * @param takerGets - What the taker will receive (currency, issuer, value)
 * @param takerPays - What the taker will pay (currency, issuer, value)
 * @param isHybrid - If true, creates a hybrid offer (part of both domain and open orderbook)
 */
export async function createDEXOrder(
  client: Client,
  accountAddress: string,
  domainId: string,
  takerGets: {
    currency: string;
    issuer?: string;
    value: string;
  },
  takerPays: {
    currency: string;
    issuer?: string;
    value: string;
  },
  isHybrid: boolean = false
): Promise<{
  success: boolean;
  transaction?: PermissionedOfferCreate;
  error?: string;
}> {
  try {
    console.log('=== Preparing Permissioned DEX Order ===');
    console.log('Account:', accountAddress);
    console.log('Domain ID:', domainId);
    console.log('TakerGets:', takerGets);
    console.log('TakerPays:', takerPays);
    console.log('Hybrid:', isHybrid);

    // Validate IOU currencies have issuers
    if (takerGets.currency !== 'XRP' && !takerGets.issuer) {
      return {
        success: false,
        error: `TakerGets currency ${takerGets.currency} requires an issuer`,
      };
    }
    if (takerPays.currency !== 'XRP' && !takerPays.issuer) {
      return {
        success: false,
        error: `TakerPays currency ${takerPays.currency} requires an issuer`,
      };
    }

    // Build TakerGets amount (XRP is just a string, IOU is an object)
    const takerGetsAmount: any = takerGets.currency === 'XRP'
      ? takerGets.value
      : {
          currency: takerGets.currency,
          issuer: takerGets.issuer!,
          value: takerGets.value,
        };

    // Build TakerPays amount (XRP is just a string, IOU is an object)
    const takerPaysAmount: any = takerPays.currency === 'XRP'
      ? takerPays.value
      : {
          currency: takerPays.currency,
          issuer: takerPays.issuer!,
          value: takerPays.value,
        };

    // Build OfferCreate transaction matching XLS-0081 spec structure
    const offerCreate: PermissionedOfferCreate = {
      TransactionType: 'OfferCreate',
      Account: accountAddress,
      TakerGets: takerGetsAmount,
      TakerPays: takerPaysAmount,
      DomainID: domainId,
    };

    // Add hybrid flag if requested (tfHybrid = 0x00100000)
    if (isHybrid) {
      if (!domainId) {
        return {
          success: false,
          error: 'Hybrid offers require a DomainID',
        };
      }
      const currentFlags = typeof offerCreate.Flags === 'number' ? offerCreate.Flags : 0;
      offerCreate.Flags = currentFlags | 0x00100000; // tfHybrid flag
    }

    console.log('OfferCreate transaction:', offerCreate);

    // Autofill the transaction
    const prepared = await client.autofill(offerCreate as any);
    console.log('OfferCreate transaction prepared:', prepared);

    return {
      success: true,
      transaction: prepared as PermissionedOfferCreate,
    };
  } catch (error) {
    console.error('Error preparing permissioned DEX order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancel a DEX order
 * Returns prepared transaction payload (ready to be signed and submitted)
 * 
 * @param client - XRPL client
 * @param accountAddress - Address that placed the order
 * @param offerSequence - Sequence number of the offer to cancel
 */
export async function cancelDEXOrder(
  client: Client,
  accountAddress: string,
  offerSequence: number
): Promise<{
  success: boolean;
  transaction?: OfferCancel;
  error?: string;
}> {
  try {
    console.log('=== Preparing Order Cancellation ===');
    console.log('Account:', accountAddress);
    console.log('Offer Sequence:', offerSequence);

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
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get order book for a trading pair
 * Fetches offers from the permissioned DEX orderbook
 * Based on XLS-0081 specification for book_offers RPC
 * 
 * @param client - XRPL client
 * @param pair - Trading pair to query
 * @param domainId - Optional domain ID to filter by permissioned domain
 * @param limit - Maximum number of offers to return (default: 20)
 * @param taker - Optional account address to use as perspective
 */
export async function getOrderBook(
  client: Client,
  pair: TradingPair,
  domainId?: string,
  limit: number = 20,
  taker?: string
): Promise<{
  success: boolean;
  offers?: any[];
  error?: string;
}> {
  try {
    console.log('=== Fetching Order Book ===');
    console.log('Trading Pair:', `${pair.baseCurrency}/${pair.quoteCurrency}`);
    console.log('Domain ID:', domainId || 'Open DEX');
    console.log('Limit:', limit);

    // Build taker_gets and taker_pays for book_offers
    const takerGets = {
      currency: pair.quoteCurrency === 'XRP' ? 'XRP' : pair.quoteCurrency,
      ...(pair.quoteCurrency !== 'XRP' && pair.quoteIssuer
        ? { issuer: pair.quoteIssuer }
        : {}),
    };

    const takerPays = {
      currency: pair.baseCurrency === 'XRP' ? 'XRP' : pair.baseCurrency,
      ...(pair.baseCurrency !== 'XRP' && pair.baseIssuer
        ? { issuer: pair.baseIssuer }
        : {}),
    };

    // Build book_offers request
    const request: any = {
      command: 'book_offers',
      taker_gets: takerGets,
      taker_pays: takerPays,
      limit: limit,
      ledger_index: 'validated',
    };

    // Add domain parameter if provided (XLS-0081)
    if (domainId) {
      request.domain = domainId;
    }

    // Add taker if provided
    if (taker) {
      request.taker = taker;
    }

    console.log('book_offers request:', request);

    const response = await client.request(request);
    const result = response.result as any;

    if (result.offers && Array.isArray(result.offers)) {
      console.log(`✅ Retrieved ${result.offers.length} offers`);
      return {
        success: true,
        offers: result.offers,
      };
    }

    return {
      success: true,
      offers: [],
    };
  } catch (error) {
    console.error('Error fetching order book:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all offers for an account
 * Fetches all offers placed by a specific account
 * 
 * @param client - XRPL client
 * @param accountAddress - Account address to query
 * @param domainId - Optional domain ID to filter by permissioned domain
 */
export async function getAccountOffers(
  client: Client,
  accountAddress: string,
  domainId?: string
): Promise<{
  success: boolean;
  offers?: any[];
  error?: string;
}> {
  try {
    console.log('=== Fetching Account Offers ===');
    console.log('Account:', accountAddress);
    console.log('Domain ID:', domainId || 'All domains');

    const request: any = {
      command: 'account_objects',
      account: accountAddress,
      type: 'offer',
      ledger_index: 'validated',
    };

    const response = await client.request(request);
    const result = response.result as any;

    let offers = result.account_objects || [];

    // Filter by domain if specified
    if (domainId && offers.length > 0) {
      offers = offers.filter((offer: any) => offer.DomainID === domainId);
    }

    console.log(`✅ Retrieved ${offers.length} offer(s)`);
    return {
      success: true,
      offers: offers,
    };
  } catch (error) {
    console.error('Error fetching account offers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

