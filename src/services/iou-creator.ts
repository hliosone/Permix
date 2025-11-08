import {
  Client,
  AccountSet,
  Payment,
  TrustSet,
  AccountSetAsfFlags,
  TrustSetFlags,
} from 'xrpl';

/**
 * Convert string to hex padded (for currency codes longer than 3 characters)
 * Based on: https://docs.xrpl-commons.org/token-issuance-and-liquidity/issuing-tokens
 */
function convertStringToHexPadded(str: string): string {
  // Convert string to hexadecimal
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const hexChar = str.charCodeAt(i).toString(16);
    hex += hexChar;
  }

  // Pad with zeros to ensure it's 40 characters long
  const paddedHex = hex.padEnd(40, '0');
  return paddedHex.toUpperCase(); // Typically, hex is handled in uppercase
}

/**
 * Enable rippling on issuer account (required for AMMs and token operations)
 * Returns the prepared transaction payload (ready to be signed and submitted)
 * Based on: https://docs.xrpl-commons.org/token-issuance-and-liquidity/issuing-tokens
 * 
 * @param client - XRPL client
 * @param issuerAddress - Issuer wallet address
 */
export async function enableRippling(
  client: Client,
  issuerAddress: string
): Promise<AccountSet> {
  const accountSet: AccountSet = {
    TransactionType: 'AccountSet',
    Account: issuerAddress,
    SetFlag: AccountSetAsfFlags.asfDefaultRipple,
  };

  const prepared = await client.autofill(accountSet);
  console.log('Enable rippling transaction prepared:', prepared);

  return prepared;
}

/**
 * Set account flag (one flag at a time)
 * Returns the prepared transaction payload (ready to be signed and submitted)
 * 
 * @param client - XRPL client
 * @param issuerAddress - Issuer wallet address
 * @param flag - Account set flag to set (e.g., AccountSetAsfFlags.asfRequireAuth)
 */
export async function setFlag(
  client: Client,
  issuerAddress: string,
  flag: AccountSetAsfFlags
): Promise<AccountSet> {
  const accountSet: AccountSet = {
    TransactionType: 'AccountSet',
    Account: issuerAddress,
    SetFlag: flag,
  };

  const prepared = await client.autofill(accountSet);
  
  const flagName = Object.keys(AccountSetAsfFlags).find(
    key => AccountSetAsfFlags[key as keyof typeof AccountSetAsfFlags] === flag
  );
  
  console.log(`Set flag transaction prepared: ${flagName} (${flag})`, prepared);

  return prepared;
}

/**
 * Issue tokens to a receiver
 * Returns the prepared transaction payload (ready to be signed and submitted)
 * Note: The receiver must have a trustline to the issuer before tokens can be issued
 * 
 * Based on: https://docs.xrpl-commons.org/token-issuance-and-liquidity/issuing-tokens
 * 
 * @param client - XRPL client
 * @param issuerAddress - Issuer wallet address
 * @param receiverAddress - Receiver wallet address
 * @param currencyCode - Currency code (3 letters or longer, will be converted to hex if > 3 chars)
 * @param amount - Amount of tokens to issue
 */
export async function issueToken(
  client: Client,
  issuerAddress: string,
  receiverAddress: string,
  currencyCode: string,
  amount: string
): Promise<Payment> {
  // Use currency code as-is (no hex conversion needed for standard 3-letter codes)
  // Only convert to hex if longer than 3 characters
  const currency = currencyCode.length > 3 ? convertStringToHexPadded(currencyCode) : currencyCode;

  // Get issuer account sequence for proper transaction ordering
  const issuerAccountInfo = await client.request({
    command: 'account_info',
    account: issuerAddress,
  });
  let sequence = (issuerAccountInfo.result as any).account_data.Sequence;

  const sendPayment: Payment = {
    TransactionType: 'Payment',
    Account: issuerAddress,
    Amount: {
      currency: currency,
      issuer: issuerAddress,
      value: amount,
    },
    Destination: receiverAddress,
    Sequence: sequence++, // Increment sequence for proper ordering
  };

  console.log('Issue token transaction:', sendPayment);

  const prepared = await client.autofill(sendPayment);
  console.log('Issue token transaction prepared:', prepared);

  return prepared;
}

/**
 * Create a trust line (required before issuing tokens to a receiver)
 * Returns the prepared transaction payload (ready to be signed and submitted)
 * 
 * @param client - XRPL client
 * @param receiverAddress - Receiver wallet address
 * @param issuerAddress - Issuer wallet address
 * @param currencyCode - Currency code (3 letters or longer, will be converted to hex if > 3 chars)
 * @param limitAmount - Trustline limit (default: '10000')
 * @param flags - Optional array of TrustSetFlags to combine with bitwise OR (e.g., [TrustSetFlags.tfClearNoRipple])
 */
export async function createTrustLine(
  client: Client,
  receiverAddress: string,
  issuerAddress: string,
  currencyCode: string,
  limitAmount: string = '10000',
  flags: TrustSetFlags[] = []
): Promise<TrustSet> {
  // Use currency code as-is (no hex conversion needed for standard 3-letter codes)
  // Only convert to hex if longer than 3 characters
  const currency = currencyCode.length > 3 ? convertStringToHexPadded(currencyCode) : currencyCode;

  const trustSet: TrustSet = {
    TransactionType: 'TrustSet',
    Account: receiverAddress,
    LimitAmount: {
      currency: currency,
      issuer: issuerAddress,
      value: limitAmount,
    },
  };

  // Combine flags with bitwise OR if provided
  if (flags && flags.length > 0) {
    trustSet.Flags = flags.reduce((acc, flag) => acc | flag, 0);
  }

  console.log('TrustSet transaction:', trustSet);

  const prepared = await client.autofill(trustSet);
  console.log('Trust line transaction prepared:', prepared);

  return prepared;
}

/**
 * Create IOU token setup and return prepared transactions (enables rippling and creates trustline)
 * Returns prepared transaction payloads ready to be signed and submitted
 * Does NOT sign or submit transactions - returns payloads only
 * 
 * @param client - XRPL client
 * @param issuerAddress - Issuer wallet address (cold wallet)
 * @param receiverAddress - Receiver wallet address (hot wallet) that will receive tokens
 * @param currencyCode - Currency code (3 letters or longer)
 * @param trustlineLimit - Trustline limit (default: '10000')
 * @param trustlineFlags - Optional array of TrustSetFlags
 * @returns Object containing prepared transactions and token information
 */
export async function createIOUToken(
  client: Client,
  issuerAddress: string,
  receiverAddress: string,
  currencyCode: string,
  trustlineLimit: string = '10000',
  trustlineFlags: TrustSetFlags[] = []
): Promise<{
  success: boolean;
  currency: string;
  issuer: string;
  receiver: string;
  transactions: {
    enableRippling: AccountSet;
    createTrustLine: TrustSet;
  };
  error?: string;
}> {
  try {
    // Step 1: Enable rippling on issuer
    const rippleTx = await enableRippling(client, issuerAddress);

    // Step 2: Create trustline from receiver to issuer
    const trustTx = await createTrustLine(
      client,
      receiverAddress,
      issuerAddress,
      currencyCode,
      trustlineLimit,
      trustlineFlags
    );

    return {
      success: true,
      currency: currencyCode,
      issuer: issuerAddress,
      receiver: receiverAddress,
      transactions: {
        enableRippling: rippleTx,
        createTrustLine: trustTx,
      },
    };
  } catch (error: any) {
    console.error('Error creating IOU token setup:', error);
    return {
      success: false,
      currency: currencyCode,
      issuer: issuerAddress,
      receiver: receiverAddress,
      transactions: {
        enableRippling: {} as AccountSet,
        createTrustLine: {} as TrustSet,
      },
      error: error?.message || 'Unknown error',
    };
  }
}

