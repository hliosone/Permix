import {
  Client,
  AccountSet,
  Payment,
  TrustSet,
  AccountSetAsfFlags,
  AccountSetTfFlags,
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
 */
async function enableRippling(client: Client, walletAddress: string): Promise<AccountSet> {
  const accountSet: AccountSet = {
    TransactionType: 'AccountSet',
    Account: walletAddress,
    SetFlag: AccountSetAsfFlags.asfDefaultRipple,
  };

  const prepared = await client.autofill(accountSet);
  console.log('Enable rippling transaction prepared:', prepared);

  return prepared;
}

/**
 * Set account flags for IOU token issuance using transaction flags (tfFlags)
 * Returns prepared transaction payloads (ready to be signed and submitted)
 * Uses Flags field with tfFlags for flags that support it, SetFlag for others
 */
async function setAccountFlags(
  client: Client,
  walletAddress: string,
  flags: {
    requireAuth: boolean;
    freeze: boolean;
    clawback: boolean;
  }
): Promise<AccountSet[]> {
  const preparedTransactions: AccountSet[] = [];

  // Build transaction flags mask (tfFlags) - these can be combined
  let tfFlagsMask = 0;

  // Use transaction flags where available
  if (flags.requireAuth) {
    tfFlagsMask += AccountSetTfFlags.tfRequireAuth; // 0x00040000
  }

  // SetFlags for flags not available as transaction flags
  const setFlags: number[] = [];

  // Always enable rippling (asfDefaultRipple = 8) - not available as tfFlag
  setFlags.push(AccountSetAsfFlags.asfDefaultRipple);

  if (flags.freeze) {
    // asfGlobalFreeze = 7 - not available as tfFlag
    setFlags.push(AccountSetAsfFlags.asfGlobalFreeze);
  }
  if (flags.clawback) {
    // asfAllowTrustLineClawback = 16 - not available as tfFlag
    setFlags.push(AccountSetAsfFlags.asfAllowTrustLineClawback);
  }

  // First, set transaction flags if any
  if (tfFlagsMask > 0) {
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: walletAddress,
      Flags: tfFlagsMask,
    };

    console.log('Preparing transaction flags:', {
      requireAuth: flags.requireAuth,
      tfFlagsMask: `0x${tfFlagsMask.toString(16)} (${tfFlagsMask})`,
    });

    const prepared = await client.autofill(accountSet);
    preparedTransactions.push(prepared);
    console.log('Transaction flags prepared:', prepared);
  }

  // Then, set account flags that require SetFlag (one per transaction)
  for (const flag of setFlags) {
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: walletAddress,
      SetFlag: flag,
    };

    const flagName = Object.keys(AccountSetAsfFlags).find(
      key => AccountSetAsfFlags[key as keyof typeof AccountSetAsfFlags] === flag
    );

    console.log(`Preparing account flag: ${flagName} (${flag})`);

    const prepared = await client.autofill(accountSet);
    preparedTransactions.push(prepared);
    console.log(`Flag ${flagName} prepared:`, prepared);
  }

  return preparedTransactions;
}

/**
 * Create a trust line (required before issuing tokens to a receiver)
 * Returns the prepared transaction payload (ready to be signed and submitted)
 * Based on: https://docs.xrpl-commons.org/token-issuance-and-liquidity/issuing-tokens
 */
async function createTrustLine(
  client: Client,
  receiverAddress: string,
  issuerAddress: string,
  currencyCode: string,
  limitAmount: string = '500000000' // 500M tokens default
): Promise<TrustSet> {
  // Use hex padded if currency code is longer than 3 characters
  const currency = currencyCode.length > 3 ? convertStringToHexPadded(currencyCode) : currencyCode;

  const trustSet: TrustSet = {
    TransactionType: 'TrustSet',
    Account: receiverAddress,
    LimitAmount: {
      currency: currency,
      issuer: issuerAddress,
      value: limitAmount,
    },
    Flags: TrustSetFlags.tfClearNoRipple,
  };

  console.log('TrustSet transaction:', trustSet);

  const prepared = await client.autofill(trustSet);
  console.log('Trust line transaction prepared:', prepared);

  return prepared;
}

/**
 * Issue tokens to a receiver (after trust line is created)
 * Returns the prepared transaction payload (ready to be signed and submitted)
 * Based on: https://docs.xrpl-commons.org/token-issuance-and-liquidity/issuing-tokens
 */
async function issueTokens(
  client: Client,
  issuerAddress: string,
  receiverAddress: string,
  currencyCode: string,
  amount: string
): Promise<Payment> {
  // Use hex padded if currency code is longer than 3 characters
  const currency = currencyCode.length > 3 ? convertStringToHexPadded(currencyCode) : currencyCode;

  const sendPayment: Payment = {
    TransactionType: 'Payment',
    Account: issuerAddress,
    Destination: receiverAddress,
    Amount: {
      currency: currency,
      issuer: issuerAddress,
      value: amount,
    },
  };

  console.log('Payment transaction:', sendPayment);

  const prepared = await client.autofill(sendPayment);
  console.log('Payment transaction prepared:', prepared);

  return prepared;
}

/**
 * Create an IOU token on XRPL
 * Returns prepared transaction payloads (ready to be signed and submitted)
 * This sets up the issuer account to be ready to issue tokens
 * Based on: https://docs.xrpl-commons.org/token-issuance-and-liquidity/issuing-tokens
 * 
 * @param client - XRPL client
 * @param issuerAddress - Issuer wallet address
 * @param currencyCode - Currency code (3 letters or longer, will be converted to hex if > 3 chars)
 * @param flags - Token flags (requireAuth, freeze, clawback)
 * @param initialAmount - Initial amount to issue (optional, defaults to 0)
 * @param destination - Destination address for initial issuance (optional, requires receiverAddress if provided)
 * @param receiverAddress - Receiver address for creating trust line (optional, required if issuing initial tokens)
 */
export async function createIOUToken(
  client: Client,
  issuerAddress: string,
  currencyCode: string,
  flags: {
    requireAuth: boolean;
    freeze: boolean;
    clawback: boolean;
  },
  initialAmount: string = '0',
  destination?: string,
  receiverAddress?: string
): Promise<{
  success: boolean;
  transactions: Array<AccountSet | TrustSet | Payment>;
  currency: string;
  issuer: string;
  error?: string;
}> {
  const transactions: Array<AccountSet | TrustSet | Payment> = [];

  try {
    // 1. Validate inputs
    if (!currencyCode || currencyCode.length < 3) {
      throw new Error('Currency code must be at least 3 characters');
    }

    if (!issuerAddress) {
      throw new Error('Issuer address is required');
    }

    // 2. Set account flags (includes enabling rippling)
    console.log('Preparing account flags for IOU token...');
    const flagTransactions = await setAccountFlags(client, issuerAddress, flags);
    transactions.push(...flagTransactions);

    // 3. If initial amount is provided and destination is specified, create trust line and issue tokens
    if (initialAmount !== '0' && destination) {
      if (!receiverAddress) {
        throw new Error('Receiver address is required to issue initial tokens');
      }

      console.log(`Preparing trust line for ${currencyCode}...`);
      const trustLineTx = await createTrustLine(client, receiverAddress, issuerAddress, currencyCode);
      transactions.push(trustLineTx);

      console.log(`Preparing initial issuance of ${initialAmount} ${currencyCode} to ${destination}...`);
      const issueTx = await issueTokens(client, issuerAddress, destination, currencyCode, initialAmount);
      transactions.push(issueTx);
    }

    // 4. Return success with all prepared transactions
    return {
      success: true,
      transactions,
      currency: currencyCode,
      issuer: issuerAddress,
    };
  } catch (error) {
    console.error('Error preparing IOU token transactions:', error);
    return {
      success: false,
      transactions,
      currency: currencyCode,
      issuer: issuerAddress,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send tokens to a new wallet
 * Returns prepared transaction payloads (ready to be signed and submitted)
 * This function prepares:
 * 1. Trustline creation from receiver to issuer
 * 2. Payment from issuer to receiver
 * 
 * Note: The receiver wallet must be funded separately before these transactions can be executed
 * 
 * Based on: https://docs.xrpl-commons.org/token-issuance-and-liquidity/issuing-tokens
 * 
 * @param client - XRPL client
 * @param issuerAddress - Issuer wallet address (the one that created the token)
 * @param receiverAddress - Receiver wallet address
 * @param currencyCode - Currency code of the token
 * @param amount - Amount of tokens to send
 */
export async function sendTokenToNewWallet(
  client: Client,
  issuerAddress: string,
  receiverAddress: string,
  currencyCode: string,
  amount: string
): Promise<{
  success: boolean;
  transactions: {
    trustLine: TrustSet;
    payment: Payment;
  };
  receiverAddress: string;
  error?: string;
}> {
  try {
    console.log('=== Preparing token transfer transactions ===');
    console.log(`Token: ${currencyCode}, Amount: ${amount}`);
    console.log(`Issuer: ${issuerAddress}, Receiver: ${receiverAddress}`);

    // 1. Prepare trustline from receiver to issuer
    console.log('Preparing trustline from receiver to issuer...');
    const trustLineTx = await createTrustLine(
      client,
      receiverAddress,
      issuerAddress,
      currencyCode,
      '500000000' // 500M tokens limit
    );

    // 2. Prepare payment from issuer to receiver
    console.log(`Preparing payment of ${amount} ${currencyCode} from issuer to receiver...`);
    const paymentTx = await issueTokens(
      client,
      issuerAddress,
      receiverAddress,
      currencyCode,
      amount
    );

    console.log('=== Token transfer transactions prepared successfully ===');
    console.log({
      receiverAddress,
      trustLineTransaction: trustLineTx,
      paymentTransaction: paymentTx,
    });

    return {
      success: true,
      transactions: {
        trustLine: trustLineTx,
        payment: paymentTx,
      },
      receiverAddress,
    };
  } catch (error) {
    console.error('Error preparing token transfer transactions:', error);
    return {
      success: false,
      transactions: {
        trustLine: {} as TrustSet,
        payment: {} as Payment,
      },
      receiverAddress,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

