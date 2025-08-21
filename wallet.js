const crypto = require('crypto');

function generateKeyPair() {
  // Generate an EC key pair (prime256v1 curve) for the wallet
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1'
  });
  return { // Export to two files (Public and Private PEM file)
    privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }),
    publicKey: publicKey.export({ type: 'spki', format: 'pem' })
  };
}

module.exports = { generateKeyPair };
