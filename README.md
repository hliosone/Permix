# PermiX - Permissioned DEX for Regulatory Compliance

A permissioned decentralized exchange (DEX) built on the XRPL (XRP Ledger) that enables institutions to create compliant trading environments with credential-based access control. PermiX solves the critical problem of regulatory compliance for decentralized exchanges by allowing institutions to define policies and verify user credentials before granting access to trading domains.

## 🎯 Problem Statement

Traditional decentralized exchanges operate in a permissionless manner, making it difficult for institutions to comply with financial regulations such as:
- **MiCA (Markets in Crypto-Assets)** - EU regulation requiring KYC/AML compliance
- **Age restrictions** - Preventing minors from accessing certain markets
- **Seniority requirements** - Limiting access to sophisticated financial instruments
- **AML (Anti-Money Laundering)** - Verifying user identity and compliance status
- **Geographic restrictions** - Enforcing jurisdiction-based trading rules

PermiX enables institutions to create **permissioned trading domains** where only users with verified credentials can participate, ensuring full regulatory compliance while maintaining the benefits of decentralized trading.

## ✨ Key Features

- **Credential-Based Access Control**: Users bring their own verifiable credentials (age, KYC status, AML compliance, seniority, etc.)
- **OpenID4VP Integration**: Standardized credential verification compatible with state-level digital identity laws and regulations
- **Permissioned Domains**: Institutions create trading domains with specific credential requirements
- **Permissioned DEX**: Trading pairs restricted to users who meet domain requirements
- **Policy Management**: Flexible policy engine for defining access rules
- **Enterprise Dashboard**: Complete management interface for institutions
- **User Trading Interface**: Intuitive UI for credential verification and trading

## 🏗️ Architecture

PermiX leverages multiple XRPL amendments to create a comprehensive compliance solution:

### XRPL Amendments Used

1. **XLS-70 (Credentials)** - Verifiable credentials on the XRPL ledger
   - Enables issuance and verification of user credentials
   - Supports various credential types (KYC, age, AML, etc.)

2. **XLS-80 (Permissioned Domains)** - Controlled access domains
   - Institutions create domains with credential requirements
   - Automatic verification of user credentials before access

3. **XLS-81 (Permissioned DEX)** - Decentralized exchange with access control
   - Trading pairs restricted to permissioned domains
   - Order book and trading operations with credential verification

4. **XLS-75 (Permission Delegations)** - Delegated authority management
   - Institutions can delegate management permissions
   - Granular control over domain and token operations

### Token Support

**Current Implementation**: PermiX currently uses **IOU tokens** (standard XRPL trust lines) for all trading pairs.

**Future Support**: Multi-Purpose Tokens (MPT) support via **XLS-33** is planned for future releases. However, as the Permissioned DEX amendment (XLS-81) is very recent and still in active development on Devnet, MPT integration with permissioned domains is not yet available. Once the XRPL ecosystem stabilizes these features, PermiX will add full MPT support.

### OpenID4VP Integration

PermiX integrates with **OpenID for Verifiable Presentations (OpenID4VP)** to verify credentials issued on the XRPL ledger. This integration is becoming increasingly important as digital identity laws are adopted at state and national levels worldwide.

#### Why OpenID4VP?

As governments and regulatory bodies adopt digital identity frameworks (such as the EU's eIDAS 2.0, US state-level digital ID initiatives, and similar programs globally), OpenID4VP provides a standardized protocol for:

- **Interoperable Credential Verification**: Works with credentials issued by various trusted identity providers
- **Privacy-Preserving Verification**: Users can prove they meet requirements without revealing unnecessary personal information
- **Regulatory Compliance**: Aligns with emerging digital identity standards and regulations
- **Cross-Border Recognition**: Supports international credential verification for global trading

#### How It Works

1. **Credential Issuance**: Institutions issue XRPL credentials (XLS-70) to users who have verified their identity through OpenID4VP
2. **Verification Flow**: When users request access to a permissioned domain:
   - User presents their verifiable credentials via OpenID4VP
   - PermiX verifies the credentials against the domain's policy requirements
   - Upon successful verification, the institution issues an XRPL credential
   - The user accepts the credential on-chain, enabling domain access

3. **Compliance Benefits**:
   - **MiCA Compliance**: Verifies KYC/AML status through standardized digital identity protocols
   - **Age Verification**: Confirms user age without storing full date of birth
   - **Geographic Compliance**: Validates jurisdiction requirements for regulatory compliance
   - **Audit Trail**: All verifications are recorded on-chain for regulatory reporting

#### Configuration

OpenID4VP integration can be configured via environment variables:

```bash
# OpenID4VP Configuration
OPENID4VP_ENDPOINT=https://api.example.com/verify
OPENID4VP_CLIENT_ID=your_client_id
OPENID4VP_CLIENT_SECRET=your_client_secret
```

**Note**: OpenID4VP integration is designed to work with state-issued digital identities and trusted identity providers as they become available in different jurisdictions.

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **XRPL Devnet Account** - Get test XRP from the [XRPL Faucet](https://xrpl.org/resources/dev-tools/xrp-faucets)
- **TypeScript** knowledge (optional but recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd XRPL_Hackathon/Permix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   # XRPL Configuration
   XRPL_NETWORK=devnet
   XRPL_SERVER=wss://s.devnet.rippletest.net:51233
   
   # Enterprise Wallet (for issuing credentials)
   VITE_KYC_ISSUER_SEED=sYourIssuerWalletSeedHere
   VITE_KYC_USER_SEED=sYourUserWalletSeedHere
   
   # OpenID4VP Configuration (for credential verification)
   OPENID4VP_ENDPOINT=https://api.example.com/verify
   OPENID4VP_CLIENT_ID=your_client_id
   OPENID4VP_CLIENT_SECRET=your_client_secret
   
   # Optional: For production deployments
   NODE_ENV=development
   PORT=3000
   ```

   **⚠️ Security Note**: Never commit your `.env` file or wallet seeds to version control!

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 🧪 Testing

PermiX includes comprehensive end-to-end tests that verify the complete flow from credential issuance to trading.

### Running Tests

The test suite supports multiple test scenarios:

```bash
# Run all tests (full end-to-end flow)
npx tsx test/test-end-to-end.ts

# Run specific test suites
npx tsx test/test-end-to-end.ts tokens      # Token creation and distribution
npx tsx test/test-end-to-end.ts domain      # Permissioned domain creation
npx tsx test/test-end-to-end.ts credential  # Credential issuance and verification
npx tsx test/test-end-to-end.ts dex         # Permissioned DEX operations
npx tsx test/test-end-to-end.ts full        # Complete end-to-end flow
```

### Test Coverage

The test suite covers:

1. **Token Creation & Distribution**
   - IOU token creation
   - Trust line setup
   - Token distribution (cold → hot → user)

2. **Permissioned Domain Creation**
   - Domain creation with credential requirements
   - Credential verification setup

3. **Credential Issuance**
   - KYC credential creation
   - Credential acceptance by users
   - Credential verification

4. **Permissioned DEX Operations**
   - Order creation on permissioned DEX
   - Order book queries
   - Account offer management
   - Order cancellation

5. **Complete End-to-End Flow**
   - Full integration test from token creation to trading

### Test Output Example

```
🚀 Starting XRPL Permissioned DEX Tests
======================================================================
📋 Test Type: FULL
======================================================================

🌐 Connecting to XRPL Devnet...
✅ Connected to XRPL Devnet

💰 Setting up wallets...
❄️  Cold Wallet (Issuer): r3pytKq2jLz44arW1qhQH284RgCiNPD6Xt
🔥 Hot Wallet (Distribution): rsung9fi3SEGYAbYk3p5NCipRkQdgiLhg8
👤 User Wallet (Test): rnWpKZK5EgwWwWeo6kXtXpqF4k949Ngh3j

======================================================================
TEST 1: Cold Wallet (Issuer) Creates IOU Token
======================================================================
✅ Token created successfully

======================================================================
TEST 2: Token Distribution (Cold → Hot → User)
======================================================================
✅ Tokens distributed successfully

======================================================================
TEST 3: Cold Wallet Creates Permissioned Domain
======================================================================
✅ Domain created successfully

======================================================================
TEST 4: Issue Credential for User
======================================================================
✅ Credential issued and accepted

======================================================================
TEST 5: User Places Order on Permissioned DEX
======================================================================
✅ Order placed successfully

📊 FULL E2E TEST SUMMARY
======================================================================
✅ Token Creation: PASSED
✅ Token Receiving: PASSED
✅ Domain Creation: PASSED
✅ Credential Issuance: PASSED
✅ Order Placement: PASSED

🎉 Tests Completed!
```

## 📁 Project Structure

```
Permix/
├── src/
│   ├── components/          # React UI components
│   │   ├── EnterpriseDashboard.tsx
│   │   ├── UserDashboard.tsx
│   │   ├── DomainCreator.tsx
│   │   ├── PolicyBuilder.tsx
│   │   ├── PermissionedDEX.tsx
│   │   └── VerificationFlow.tsx
│   ├── services/            # XRPL service layer
│   │   ├── xrpl-setup.ts           # XRPL client connection
│   │   ├── iou-creator.ts          # Token creation and management
│   │   ├── permissioned-domains.ts # Domain operations (XLS-80)
│   │   ├── permissioned-dex.ts     # DEX operations (XLS-81)
│   │   └── transaction-signer.ts   # Transaction signing utilities
│   └── App.tsx              # Main application component
├── test/
│   ├── test-end-to-end.ts   # Comprehensive E2E tests
│   ├── domainswork.ts       # Domain-specific tests
│   └── issue-token-simple.ts # Token creation tests
├── package.json
└── README.md
```

## 🔄 How It Works

### 1. Institution Flow

1. **Create Policy**: Institution defines credential requirements (e.g., "KYC verified + Age 18+")
2. **Create Domain**: Institution creates a permissioned domain with the policy
3. **Issue Credentials**: Institution issues credentials to verified users
4. **Create DEX**: Institution sets up trading pairs within the domain
5. **Manage Access**: Institution monitors and manages domain membership

### 2. User Flow

1. **Connect Wallet**: User connects their XRPL wallet
2. **Request Credentials**: User requests credentials from institution
3. **Accept Credentials**: User accepts issued credentials on-chain
4. **Browse Markets**: User views available trading pairs in domains they qualify for
5. **Trade**: User places orders on permissioned DEX (credentials verified automatically)

### 3. Credential Verification

When a user attempts to interact with a permissioned domain:
- The XRPL ledger automatically verifies the user's credentials
- Only users with matching credentials (domain) can create orders
- All transactions are recorded on-chain for audit purposes

## 🌐 Network Deployment

### Current Status: **Devnet Only**

⚠️ **Important**: PermiX is currently deployed and tested on **XRPL Devnet** only. The following amendments are required and may not be available on Mainnet:

- XLS-70 (Credentials) - **Devnet only**
- XLS-80 (Permissioned Domains) - **Devnet only**
- XLS-81 (Permissioned DEX) - **Devnet only**

### Devnet Configuration

- **WebSocket**: `wss://s.devnet.rippletest.net:51233`
- **JSON-RPC**: `https://s.devnet.rippletest.net:51234`
- **Explorer**: Use [XRPScan Devnet](https://xrpscan.com/) or [LiveScanXRPL](https://livenet.xrpl.org/)

### Getting Test XRP

Use the XRPL Devnet Faucet to fund your test wallets:
- [XRPL Faucet](https://xrpl.org/resources/dev-tools/xrp-faucets)
- The test suite automatically funds wallets using `client.fundWallet()`

## 🔐 Security Considerations

- **Never commit wallet seeds** to version control
- **Use environment variables** for sensitive configuration
- **Test thoroughly on Devnet** before any production deployment
- **Verify transaction results** before proceeding with dependent operations
- **Monitor transaction fees** (XRP costs for each operation)

## 📚 Additional Resources

### XRPL Documentation
- [XRPL Developer Portal](https://xrpl.org/)
- [XRPL Standards (XLS)](https://github.com/XRPLF/XRPL-Standards)
- [XRPL.js Documentation](https://js.xrpl.org/)

### Amendment Specifications
- [XLS-70: Credentials](https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0070-credentials)
- [XLS-80: Permissioned Domains](https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0080-permissioned-domains)
- [XLS-81: Permissioned DEX](https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0081-permissioned-dex)
- [XLS-33: Multi-Purpose Tokens](https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0033-multi-purpose-tokens)
- [XLS-75: Permission Delegations](https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0075-permission-delegations)

### Code Samples
- [XRPL Dev Portal Code Samples](https://github.com/XRPLF/xrpl-dev-portal/tree/master/_code-samples)
- [XRPL.js Python Simple Scripts](https://github.com/RippleDevRel/xrpl-js-python-simple-scripts)

## 🤝 Contributing

This project is part of an XRPL Hackathon. Contributions and feedback are welcome!


## 🙏 Acknowledgments

- Built for XRPL Hackathon
- Uses XRPL amendments for compliance and permissioned trading
- Inspired by the need for regulatory-compliant DeFi solutions

---

**Status**: 🚧 Active Development on Devnet

**Last Updated**: 2025, 8 november XRPL X Roma Hackathon

For questions or issues, please open an issue on the repository.
