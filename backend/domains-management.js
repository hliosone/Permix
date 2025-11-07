const { Client, dropsToXrp } = require('xrpl');

/*
===============================================================================
                    PERMISSIONED DOMAINS - Building on XLS-80
===============================================================================

This script demonstrates Permissioned Domains functionality:
1. Domain creation with credential-based eligibility rules (XLS-70)
2. Automatic eligibility based on regulatory compliance
3. Domain modification and management
4. Multi-tier financial services scenarios

RELATIONSHIP DIAGRAM:
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CREDENTIALS (1-to-1)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Isabel Financial ──KYC──→ Alice (Client)                                  │
│  Isabel Financial ──AML──→ Alice (Client)                                  │
│  RegulatorX (SEC) ──ACCREDITED──→ Charlie (Investor)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                       ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SERVICE TIERS (1-to-many)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Private Banking Tier (Owner: Bank)                                        │
│  ├── Requires: KYC verification from licensed institution                  │
│  ├── Eligible: Alice (KYC verified)                                        │
│  └── Not eligible: Bob (unverified)                                        │
│                                                                            │
│  Institutional Trading Desk (Owner: Bank)                                  │
│  ├── Requires: Accredited Investor OR AML compliance                       │
│  ├── Eligible: Alice (AML), Charlie (Accredited)                           │
│  └── Not eligible: Bob (unverified)                                        │
└─────────────────────────────────────────────────────────────────────────────┘

TRADITIONAL FINANCE ANALOGY: Think of it like banking service tiers:
- Credentials = Your financial certifications (KYC verification, AML clearance, accredited investor status)
- Domains = Different service tiers (Private Banking, Wealth Management, Institutional Trading)
- "Membership" = Automatic qualification if you meet regulatory requirements
- Domain Owner = Financial institution setting compliance criteria

https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0080-permissioned-domains
===============================================================================
*/

// Helper function to convert text to hex
const textToHex = (text) => {
  return Buffer.from(text, 'utf8').toString('hex').toUpperCase();
};

// Helper function to submit transactions with detailed logging
const submitTransaction = async (txn, client, wallet, description = '') => {
  if (description) {
    console.log(`\n🔄 ${description}`);
  }
  
  console.log(`📤 Submitting: ${txn.TransactionType}`);
  
  try {
    const response = await client.submitAndWait(txn, {
      autofill: true,
      wallet: wallet,
    });
    
    const result = response.result;
    const txResult = result?.meta?.TransactionResult || 'Unknown';
    
    console.log(`✅ Result: ${txResult}`);
    console.log(`🔗 Hash: ${result?.hash || 'N/A'}`);
    
    if (txResult === 'tesSUCCESS') {
      console.log(`🎉 Transaction successful!`);
      
      // Extract domain ID if this is a PermissionedDomainSet transaction
      if (txn.TransactionType === 'PermissionedDomainSet' && !txn.DomainID) {
        const sequence = result.tx_json.Sequence;
        const account = result.tx_json.Account;
        console.log(`🏛️  Service tier created with Owner: ${account}, Sequence: ${sequence}`);
      }
    } else {
      console.log(`❌ Transaction failed with: ${txResult}`);
      console.log(JSON.stringify(result, null, 2));
    }
    
    return response;
    
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
    throw error;
  }
};

// Helper function to get actual domain ID from ledger objects
const getDomainId = async (client, ownerAddress, sequence) => {
  try {
    const accountObjects = await client.request({
      command: "account_objects",
      account: ownerAddress,
      ledger_index: "validated",
      type: "permissioned_domain"
    });
    
    // Find the domain that matches the sequence
    const domain = accountObjects.result.account_objects.find(obj => 
      obj.Sequence === sequence
    );
    
    if (domain && domain.index) {
      return domain.index;
    }
    
    return null;
  } catch (error) {
    console.log(`⚠️  Error fetching domain ID: ${error.message}`);
    return null;
  }
};

// Helper function to get account credentials
const getAccountCredentials = async (client, accountAddress) => {
  try {
    const accountObjects = await client.request({
      command: "account_objects",
      account: accountAddress,
      ledger_index: "validated",
      type: "credential"
    });
    
    return accountObjects.result.account_objects || [];
  } catch (error) {
    console.log(`⚠️  Error fetching credentials for ${accountAddress}: ${error.message}`);
    return [];
  }
};

// Helper function to check if account is eligible for service tier
const isEligibleForTier = (userCredentials, tierCriteria) => {
  // Check if user has any credential that matches tier's eligibility criteria
  for (const userCred of userCredentials) {
    for (const criteria of tierCriteria) {
      if (userCred.Issuer === criteria.Issuer && 
          userCred.CredentialType === criteria.CredentialType &&
          (userCred.Flags & 0x00010000) !== 0) { // Check if accepted
        return true;
      }
    }
  }
  return false;
};

// Sleep function
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

async function createPermissionDomain(domainCreatorAddress, credentialsRequired) {
    return {
        TransactionType: 'PermissionedDomainSet',
        Account: domainCreatorAddress,
        AcceptedCredentials: credentialsRequired
    }
}

// Main function
const main = async () => {
  console.log('🚀 Permissioned Domains Demo - Financial Services Architecture');
  console.log('='.repeat(70));
  
  // Connect to XRPL Devnet where both Credentials and Domains amendments are active
  console.log('🌐 Connecting to XRPL Devnet...');
  const client = new Client('wss://s.devnet.rippletest.net:51233');
  await client.connect();
  
  // Generate funded wallets
  console.log('\n💰 Creating funded test wallets...');
  const { wallet: isabelWallet } = await client.fundWallet();    // Compliance Provider
  const { wallet: regulatorWallet } = await client.fundWallet(); // Securities Authority
  const { wallet: bankOwnerWallet } = await client.fundWallet(); // Financial Institution
  const { wallet: aliceWallet } = await client.fundWallet();     // Premium Client
  const { wallet: bobWallet } = await client.fundWallet();       // Standard Client
  const { wallet: charlieWallet } = await client.fundWallet();   // Institutional Investor
  
  console.log(`🏛️ Isabel Financial Services (Compliance Provider): ${isabelWallet.address}`);
  
  await sleep(3000);
  
  // === STEP 1: REGULATORY COMPLIANCE SETUP ===
  console.log('\n' + '='.repeat(50));
  console.log('STEP 1: Regulatory Compliance Infrastructure Setup');
  console.log('='.repeat(50));
  
  const kycCredentialType = textToHex('KYC_VERIFICATION');
  const amlCredentialType = textToHex('AML_COMPLIANCE');

  
  // === STEP 2: PRIVATE BANKING TIER CREATION ===
  console.log('\n' + '='.repeat(50));
  console.log('STEP 2: Private Banking Tier Creation');
  console.log('='.repeat(50));
  
  console.log('🏛️  Creating "Private Banking Tier" - Exclusive services for KYC-verified clients');
  
  // Create Private Banking Tier (requires KYC verification from licensed institution)
  const privateBankingCreateTx = {
    TransactionType: 'PermissionedDomainSet',
    Account: bankOwnerWallet.address,
    AcceptedCredentials: [
      {
        Credential: {
          Issuer: isabelWallet.address,
          CredentialType: kycCredentialType
        }
      }
    ]
  };
};

main()
  .then(() => {
    console.log(`\n📖 Learn More:`);
    console.log(`   🔗 XLS-80 Permissioned Domains Specification: https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0080-permissioned-domains `);
    console.log(`   🔗 XLS-70 On-Chain Credentials (prerequiste): https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0070-credentials`);
  })
  .catch((error) => {
    console.error(`\n💥 Error in main execution: ${error.message}`);
    console.error(error.stack);
  });