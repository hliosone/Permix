const { Client, xrpToDrops, dropsToXrp } = require('xrpl');

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

// Helper function to get actual credential ID from ledger objects
const getActualCredentialId = async (client, accountAddress, issuer, credentialType) => {
  try {
    const accountObjects = await client.request({
      command: "account_objects",
      account: accountAddress,
      ledger_index: "validated",
      type: "credential"
    });
    
    // Find the credential that matches issuer and type
    const credential = accountObjects.result.account_objects.find(obj => 
      obj.Issuer === issuer && obj.CredentialType === credentialType
    );
    
    if (credential && credential.index) {
      return credential.index;
    }
    
    return null;
  } catch (error) {
    console.log(`⚠️  Error fetching credential ID: ${error.message}`);
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

// Helper function to check deposit authorization
const checkDepositAuthorization = async (client, sourceAccount, destinationAccount = []) => {
  try {
    const request = {
      command: "deposit_authorized",
      source_account: sourceAccount,
      destination_account: destinationAccount,
      ledger_index: "validated"
    };
    
    const response = await client.request(request);
    return response.result.deposit_authorized;
  } catch (error) {
    console.log(`⚠️  Error checking deposit authorization: ${error.message}`);
    return false;
  }
};

// Sleep function
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Main function
const main = async () => {
  console.log('🚀 On-Chain Credentials Demo (XLS-70)');
  console.log('='.repeat(70));
  
  // Connect to XRPL Devnet where Credentials amendment is active
  console.log('🌐 Connecting to XRPL Devnet...');
  const client = new Client('wss://s.devnet.rippletest.net:51233');
  await client.connect();
  
  // Generate funded wallets
  console.log('\n💰 Creating funded test wallets...');
  const wepoWallet = Wallet.fromSeed("sEdTR4iHRCs8EAX6YsgXzxKJUfNKJKr"); // KYC Issuer
  const receiverWallet = Wallet.fromSeed("sEdTR4iHRCs8EAX6YsgXzxKJUfNKJKr");

  console.log(`🏛️ Wepo (KYC Issuer): ${wepoWallet.address}`);
  console.log(`👤 Alice (KYC User): ${receiverWallet.address}`);
  await sleep(3000);
  
  // === STEP 1: CREATE KYC CREDENTIAL ===
  console.log('\n' + '='.repeat(50));
  console.log('STEP 1: Isabel Issues KYC Credential to Alice');
  console.log('='.repeat(50));
  
  const kycCredentialType = textToHex('KYC_CRED'); // "KYC" converted to hex
  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = currentTime + (365 * 24 * 60 * 60); // 1 year from now
  
  console.log(`🔑 Credential Type: KYC (${kycCredentialType})`);
  console.log(`⏰ Expiration: ${new Date(expirationTime * 1000).toISOString()}`);
  
  const credentialCreateTx = {
    TransactionType: 'CredentialCreate',
    Account: wepoWallet.address,
    Subject: receiverWallet.address,
    CredentialType: kycCredentialType,
    Expiration: expirationTime,
    URI: textToHex('https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0070-credentials')
  };
  
  await submitTransaction(
    credentialCreateTx,
    client,
    wepoWallet,
    "Creating KYC credential for Receiver"
  );
  
  // === STEP 2: RECEIVER ACCEPTS THE CREDENTIAL ===
  console.log('\n' + '='.repeat(50));
  console.log('STEP 2: Receiver Accepts KYC Credential');
  console.log('='.repeat(50));
  
  const credentialAcceptTx = {
    TransactionType: 'CredentialAccept',
    Account: receiverWallet.address,
    Issuer: wepoWallet.address,
    CredentialType: kycCredentialType
  };
  
  await submitTransaction(
    credentialAcceptTx,
    client,
    receiverWallet,
    "Receiver accepting KYC credential"
  );
  
  // === STEP 3: VERITY SETS UP DEPOSIT AUTHORIZATION ===
  console.log('\n' + '='.repeat(50));
  console.log('STEP 3: Verity Configures Deposit Authorization');
  console.log('='.repeat(50));
  
  console.log('🔐 Verity will only accept payments from KYC\'d accounts');

  // === STEP 4: TEST PAYMENTS ===
  console.log('\n' + '='.repeat(50));
  console.log('STEP 4: Testing Payments with Credentials');
  console.log('='.repeat(50));
  
  // Get the actual credential ID from Alice's account objects
  console.log('\n🔍 Fetching actual credential ID from ledger...');
  const credentialId = await getActualCredentialId(
    client, 
    receiverWallet.address,
    wepoWallet.address,
    kycCredentialType
  );
  
  if (!credentialId) {
    console.log('❌ Could not find credential ID in Receiver\'s account objects');
    console.log('📋 This might indicate the credential was not properly created or accepted');
    await client.disconnect();
    return;
  }
  
  console.log(`🆔 Actual Credential ID: ${credentialId}`);

  // Verify the credential exists and is accepted
  const receiverCredentialCheck = await getAccountCredentials(client, receiverWallet.address);
  const matchingCredential = receiverCredentialCheck.find(cred =>
    cred.index === credentialId && 
    cred.Issuer === wepoWallet.address &&
    cred.CredentialType === kycCredentialType
  );
  
  if (matchingCredential) {
    const isAccepted = (matchingCredential.Flags & 0x00010000) !== 0;
    console.log(`✅ Credential found in Receiver's account:`);
    console.log(`   - ID: ${matchingCredential.index}`);
    console.log(`   - Status: ${isAccepted ? 'ACCEPTED ✅' : 'PENDING ⏳'}`);
    console.log(`   - Issuer: ${matchingCredential.Issuer}`);
    console.log(`   - Type: ${Buffer.from(matchingCredential.CredentialType, 'hex').toString('utf8')}`);
    
    if (isAccepted) {
      console.log(`💡 This credential should work for payments to accounts that trust Wepo's KYC`);
    } else {
      console.log(`⚠️  Credential not yet accepted - payments will fail`);
    }
  } else {
    console.log(`❌ Credential not found or doesn't match expected parameters`);
  }

  console.log(`\n🌐 Explore on Devnet:`);
  console.log(`🏛️ Wepo: https://devnet.xrpl.org/accounts/${wepoWallet.address}`);
  console.log(`👤 Receiver: https://devnet.xrpl.org/accounts/${receiverWallet.address}`);
  console.log(`\n Credentials Demo Completed Successfully!`);
  await client.disconnect();
};

main()
  .then(() => {
    console.log(`\n📖 Learn More:`);
    console.log(`   🔗 XLS-70 On-Chain Credentials Specification: https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0070-credentials`);
  })
  .catch((error) => {
    console.error(`\n💥 Error in main execution: ${error.message}`);
    console.error(error.stack);
  });