// Helper function to convert text to hex
const textToHex = (text) => {
    return Buffer.from(text, 'utf8').toString('hex').toUpperCase();
};

const createCustomCredential = async (client, issuerAddress, subjectAddress, credentialTypeText, expirationEpochSeconds) => {

    const credentialTypeHex = textToHex(credentialTypeText);
    const credentialCreateTx = {
        TransactionType: 'CredentialCreate',
        Account: issuerAddress,
        Subject: subjectAddress,
        CredentialType: credentialTypeHex,
    };

    if (expirationEpochSeconds) {
        credentialCreateTx.Expiration = expirationEpochSeconds;
    }

    return credentialCreateTx;
};

const acceptCustomCredential = async (subjectAddress, issuerAddress, credentialTypeText) => {

    const credentialTypeHex = textToHex(credentialTypeText);

    return {
        TransactionType: 'CredentialAccept',
        Account: subjectAddress,
        Issuer: issuerAddress,
        CredentialType: credentialTypeHex
    };
};


// Add: Create credential helper (accepts optional client)
const createCredential = async (client, issuerWallet, subjectAddress, credentialTypeText, expirationEpochSeconds, uri) => {
    // If caller passed issuerWallet in place of client (legacy), adjust:
    if (!issuerWallet && client && client.address) {
        // nothing to do — defensive
    }
    // Allow calling signature where client is omitted:
    if (!client || typeof client.connect !== 'function') {
        // shift args: caller probably called createCredential(issuerWallet, subjectAddress, ...)
        // but to keep compatibility, if first arg isn't a client assume default client
        const defaultClient = await getDefaultClient();
        // if first param is actually issuerWallet (has .address), assign appropriately
        if (client && client.address) {
            issuerWallet = client;
            client = defaultClient;
        } else {
            client = defaultClient;
        }
    }

    const credentialTypeHex = textToHex(credentialTypeText);
    const uriHex = textToHex(uri);

    const credentialCreateTx = {
        TransactionType: 'CredentialCreate',
        Account: issuerWallet.address,
        Subject: subjectAddress,
        CredentialType: credentialTypeHex,
        Expiration: expirationEpochSeconds,
        URI: uriHex
    };

    return await submitTransaction(
        credentialCreateTx,
        client,
        issuerWallet,
        `Creating ${credentialTypeText} credential for ${subjectAddress}`
    );
};

// Add: Accept credential helper (accepts optional client)
const acceptCredential = async (client, subjectWallet, issuerAddress, credentialTypeText) => {
    if (!client || typeof client.connect !== 'function') {
        const defaultClient = await getDefaultClient();
        if (client && client.address) {
            subjectWallet = client;
            client = defaultClient;
        } else {
            client = defaultClient;
        }
    }

    const credentialTypeHex = textToHex(credentialTypeText);

    const credentialAcceptTx = {
        TransactionType: 'CredentialAccept',
        Account: subjectWallet.address,
        Issuer: issuerAddress,
        CredentialType: credentialTypeHex
    };

    return await submitTransaction(
        credentialAcceptTx,
        client,
        subjectWallet,
        `${subjectWallet.address} accepting ${credentialTypeText} credential from ${issuerAddress}`
    );
};

//main().catch(console.error);

// Export helpers for reuse
module.exports = {
    createCredential,
    acceptCredential,
    getDefaultClient,
    closeDefaultClient,
    //main
};
