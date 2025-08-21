const crypto = require('crypto');

class Block {
  constructor(index, timestamp, transactions, previousHash = '', difficulty = 2) {
    this.index = index;                     // Unique block index (height)
    this.timestamp = timestamp;             // Block creation time
    this.transactions = transactions;       // Array of transactions (data)
    this.previousHash = previousHash;       // Hash of previous block
    this.nonce = 0;                         // Nonce for Proof-of-Work
    this.difficulty = difficulty;           // Mining difficulty (adjustable)
    this.hash = this.computeHash();         // Current block hash
  }

  // Compute SHA-256 hash of the block header (index, prevHash, timestamp, data, nonce)
  computeHash() {
    const data = this.index + this.previousHash + this.timestamp +
                 JSON.stringify(this.transactions) + this.nonce;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Perform Proof-of-Work: increment nonce until hash has required leading zeros
  mineBlock() {
    const target = Array(this.difficulty + 1).join('0');
    while (this.hash.substring(0, this.difficulty) !== target) {
      this.nonce++;
      this.hash = this.computeHash();
    }
    console.log(`Block mined: ${this.hash}`);
  }
}

module.exports = Block;
