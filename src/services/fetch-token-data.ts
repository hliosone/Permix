import { Client, Wallet } from 'xrpl';

/**
 * Fetch token balance for an account
 * @param client - XRPL client
 * @param address - Account address
 * @param currencyCode - Currency code
 * @param issuerAddress - Issuer address
 */
export async function fetchTokenBalance(
  client: Client,
  address: string,
  currencyCode: string,
  issuerAddress: string
): Promise<{
  balance: string;
  currency: string;
  issuer: string;
} | null> {
  try {
    const accountLines = await client.request({
      command: 'account_lines',
      account: address,
      ledger_index: 'validated',
    });

    // Use hex padded if currency code is longer than 3 characters
    const currency = currencyCode.length > 3 
      ? convertStringToHexPadded(currencyCode) 
      : currencyCode;

    // Find the trust line for this currency and issuer
    const trustLine = accountLines.result.lines?.find(
      (line: any) => 
        line.currency === currency && 
        line.account === issuerAddress
    );

    if (trustLine) {
      return {
        balance: trustLine.balance || '0',
        currency: currencyCode,
        issuer: issuerAddress,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching token balance:', error);
    throw new Error(`Failed to fetch token balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert string to hex padded (for currency codes longer than 3 characters)
 */
function convertStringToHexPadded(str: string): string {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const hexChar = str.charCodeAt(i).toString(16);
    hex += hexChar;
  }
  const paddedHex = hex.padEnd(40, '0');
  return paddedHex.toUpperCase();
}

/**
 * Fetch account info including balances
 * @param client - XRPL client
 * @param address - Account address
 */
export async function fetchAccountInfo(client: Client, address: string) {
  try {
    const accountInfo = await client.request({
      command: 'account_info',
      account: address,
      ledger_index: 'validated',
    });

    return accountInfo.result.account_data;
  } catch (error) {
    console.error('Error fetching account info:', error);
    throw new Error(`Failed to fetch account info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

