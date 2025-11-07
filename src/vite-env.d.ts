/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOCK_WALLET_SEED?: string;
  readonly VITE_KYC_ISSUER_SEED?: string;
  readonly VITE_KYC_USER_SEED?: string;
  readonly VITE_KYC_USER_ADDR?: string;
  // Add other environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

