import { Client, Wallet } from 'xrpl';

// XRPL Testnet server

const XRPL_DEVNET_SERVER = 'wss://s.devnet.rippletest.net:51233';

/**
 * Mock wallet - In production, this would come from wallet connection
 * For now, we'll use a mock wallet that the user can replace
 */
export interface MockWallet {
  address: string;
  seed?: string; // Only for mock/testing
}

/**
 * Funded wallet data from XRPL faucet
 */
export interface FundedWallet {
  wallet: Wallet;
  balance: string | number;
  address: string;
  seed: string;
}

/**
 * Create XRPL client connection
 */
export async function createXRPLClient(): Promise<Client> {
  const client = new Client(XRPL_DEVNET_SERVER);
  await client.connect();
  console.log('Connected to XRPL testnet');
  return client;
}

/**
 * Disconnect XRPL client
 */
export async function disconnectXRPLClient(client: Client): Promise<void> {
  await client.disconnect();
  console.log('Disconnected from XRPL');
}

/**
 * Get wallet from mock wallet data
 * This is a temporary function for development
 * In production, wallet should come from actual wallet connection
 */
export function getWalletFromMock(mockWallet: MockWallet): Wallet {
  if (mockWallet.seed) {
    return Wallet.fromSeed(mockWallet.seed);
  }
  throw new Error('Wallet seed is required for IOU creation');
}

/**
 * Fund a wallet using XRPL faucet (devnet/testnet only)
 * This creates and funds a real wallet with XRP
 */
export async function fundWallet(client: Client): Promise<FundedWallet> {
  console.log('Funding account...');

  const { wallet, balance } = await client.fundWallet();

  console.log('wallet', wallet);
  console.log({
    balance,
    address: wallet.address,
    seed: wallet.seed,
  });

  return {
    wallet,
    balance: String(balance),
    address: wallet.address,
    seed: wallet.seed || '',
  };
}

/**
 * Get or create a funded wallet
 * This will fund a wallet if it doesn't exist in localStorage, otherwise reuse it
 */
export async function getFundedWallet(client: Client): Promise<FundedWallet> {
  const STORAGE_KEY = 'xrpl_funded_wallet';

  try {
    // Try to get from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.seed && parsed.address) {
        console.log('Using stored funded wallet');
        return {
          wallet: Wallet.fromSeed(parsed.seed),
          balance: parsed.balance,
          address: parsed.address,
          seed: parsed.seed,
        };
      }
    }
  } catch (error) {
    console.warn('Could not load stored wallet, funding new one:', error);
  }

  // Fund new wallet
  const funded = await fundWallet(client);

  // Store in localStorage
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        address: funded.address,
        seed: funded.seed,
        balance: funded.balance,
      })
    );
  } catch (error) {
    console.warn('Could not store wallet in localStorage:', error);
  }

  return funded;
}

/**
 * Mock wallet connection - returns a mock wallet for development
 * In production, this would connect to Xumm, GemWallet, or other wallet providers
 * 
 * @deprecated Use getFundedWallets() instead for real funded wallets
 */
export function getMockWallet(): MockWallet {
  // This is a mock wallet for development
  // In production, this should come from actual wallet connection
  // Use type assertion for Vite's import.meta.env
  const env = (import.meta as any).env as { VITE_MOCK_WALLET_SEED?: string } | undefined;
  return {
    address: 'rN7n7otQDd6FczFgLdOqDdqu7h3oMVUi9M',
    seed: env?.VITE_MOCK_WALLET_SEED || 'sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Mock seed
  };
}

