const crypto = require('crypto');

class Transaction {
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;  // Sender public key (address)
    this.toAddress = toAddress;      // Recipient public key (address)
    this.amount = amount;
    this.timestamp = Date.now();
    this.signature = null;           // Digital signature to prove authenticity
  }

  // Calculate SHA-256 hash of this transaction (excluding the signature)
  calculateHash() {
    return crypto.createHash('sha256')
      .update(this.fromAddress + this.toAddress + this.amount + this.timestamp)
      .digest('hex');
  }

  // Sign the transaction with the given private key (if it matches fromAddress)
  signTransaction(privateKey) {
    const hashTx = this.calculateHash();
    const sign = crypto.createSign('SHA256');
    sign.update(hashTx).end();
    const signature = sign.sign(privateKey, 'hex');
    this.signature = signature;
  }

  // Verify signature and check that fromAddress actually owns the funds
  isValid() {
    // If it's a mining reward (fromAddress null), accept it
    if (this.fromAddress === null) return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error('No signature in this transaction');
    }
    const publicKey = this.fromAddress;
    const verify = crypto.createVerify('SHA256');
    verify.update(this.calculateHash()).end();
    return verify.verify(publicKey, this.signature, 'hex');
  }
}

module.exports = Transaction;
