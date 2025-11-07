import { Client, Wallet } from 'xrpl';

/**
 * Transaction Signer Service
 * Simulates transaction signing using wallets from environment variables
 * This will be replaced with actual wallet connect implementation later
 */

/**
 * Get wallet from environment variable seed
 */
function getWalletFromEnv(seed?: string): Wallet | null {
  if (!seed) {
    return null;
  }
  try {
    return Wallet.fromSeed(seed);
  } catch (error) {
    console.error('Error creating wallet from seed:', error);
    return null;
  }
}

/**
 * Get KYC Issuer wallet from environment
 */
export function getKYCIssuerWallet(): Wallet | null {
  const env = (import.meta as any).env as { VITE_KYC_ISSUER_SEED?: string };
  return getWalletFromEnv(env.VITE_KYC_ISSUER_SEED);
}

/**
 * Get KYC User wallet from environment
 */
export function getKYCUserWallet(): Wallet | null {
  const env = (import.meta as any).env as { VITE_KYC_USER_SEED?: string };
  return getWalletFromEnv(env.VITE_KYC_USER_SEED);
}

/**
 * Get wallet from funded wallet storage (for issuer operations)
 */
export function getIssuerWalletFromStorage(): Wallet | null {
  try {
    const stored = localStorage.getItem('xrpl_funded_wallet');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.seed) {
        return Wallet.fromSeed(parsed.seed);
      }
    }
  } catch (error) {
    console.error('Error loading wallet from storage:', error);
  }
  return null;
}

/**
 * Sign and submit a single transaction
 * @param client - XRPL client
 * @param transaction - Prepared transaction
 * @param wallet - Wallet to sign with
 */
export async function signAndSubmitTransaction(
  client: Client,
  transaction: any,
  wallet: Wallet
): Promise<{
  success: boolean;
  hash?: string;
  error?: string;
}> {
  try {
    console.log('Signing transaction:', transaction.TransactionType);
    
    const signed = wallet.sign(transaction);
    const result = await client.submitAndWait(signed.tx_blob);
    
    const hash = result.result.hash;
    const engineResult = result.result.engine_result;
    
    if (engineResult === 'tesSUCCESS') {
      console.log('Transaction successful:', hash);
      return {
        success: true,
        hash,
      };
    } else {
      console.error('Transaction failed:', engineResult);
      return {
        success: false,
        error: `Transaction failed: ${engineResult}`,
      };
    }
  } catch (error) {
    console.error('Error signing/submitting transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sign and submit multiple transactions in sequence
 * @param client - XRPL client
 * @param transactions - Array of prepared transactions
 * @param wallet - Wallet to sign with
 */
export async function signAndSubmitTransactions(
  client: Client,
  transactions: any[],
  wallet: Wallet
): Promise<{
  success: boolean;
  hashes: string[];
  errors: string[];
}> {
  const hashes: string[] = [];
  const errors: string[] = [];

  for (const transaction of transactions) {
    const result = await signAndSubmitTransaction(client, transaction, wallet);
    if (result.success && result.hash) {
      hashes.push(result.hash);
    } else {
      errors.push(result.error || 'Unknown error');
    }
  }

  return {
    success: errors.length === 0,
    hashes,
    errors,
  };
}

/**
 * Get the appropriate wallet for signing based on context
 * For issuer operations, uses funded wallet from storage
 * For user operations, uses KYC user wallet from env
 */
export function getWalletForSigning(context: 'issuer' | 'user' = 'issuer'): Wallet | null {
  if (context === 'issuer') {
    // Try funded wallet first, fallback to KYC issuer
    return getIssuerWalletFromStorage() || getKYCIssuerWallet();
  } else {
    return getKYCUserWallet();
  }
}

