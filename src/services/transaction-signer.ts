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
 * Get KYC User address from environment
 */
export function getKYCUserAddress(): string | null {
  const env = (import.meta as any).env as { VITE_KYC_USER_ADDR?: string; VITE_KYC_USER_SEED?: string };
  
  // First try to get address directly
  if (env.VITE_KYC_USER_ADDR) {
    return env.VITE_KYC_USER_ADDR;
  }
  
  // Fallback: derive address from seed if available
  if (env.VITE_KYC_USER_SEED) {
    try {
      const wallet = Wallet.fromSeed(env.VITE_KYC_USER_SEED);
      return wallet.address;
    } catch (error) {
      console.error('Error deriving address from seed:', error);
      return null;
    }
  }
  
  return null;
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
 * Re-autofills the transaction right before submission to ensure fresh LastLedgerSequence
 * @param client - XRPL client
 * @param transaction - Transaction (will be re-autofilled before signing)
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
    
    // Re-autofill right before signing to ensure fresh LastLedgerSequence
    // This prevents tefPAST_SEQ errors when transactions are prepared in advance
    const prepared = await client.autofill(transaction);
    
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    
    const hash = result.result.hash;
    // Check transaction result from meta field
    const resultAny = result.result as any;
    const transactionResult = resultAny.meta?.TransactionResult;
    const engineResult = resultAny.engine_result;
    
    // If submitAndWait doesn't throw, transaction was likely successful
    // Check meta.TransactionResult or engine_result if available
    const isSuccess = 
      transactionResult === 'tesSUCCESS' || 
      engineResult === 'tesSUCCESS' ||
      (hash && !transactionResult && !engineResult); // If we have a hash and no error indicators, assume success
    
    if (isSuccess) {
      console.log('Transaction successful:', hash);
      return {
        success: true,
        hash,
      };
    } else {
      const errorMsg = transactionResult || engineResult || 'Unknown error';
      console.error('Transaction failed:', errorMsg);
      return {
        success: false,
        error: `Transaction failed: ${errorMsg}`,
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

