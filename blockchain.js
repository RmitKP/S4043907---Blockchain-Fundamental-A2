const fs = require('fs');
const Block = require('./block');
const Transaction = require('./transaction');

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;                     // Starting difficulty for PoW
    this.pendingTransactions = [];           // Transaction pool
    this.miningReward = 50;
    this.loadChainFromDisk();               // Load existing chain if present
  }

  createGenesisBlock() {
    return new Block(0, Date.now(), [], '0', this.difficulty);
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  // Create a new transaction (add to pool after validation)
  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transaction must include from and to address'); // Error noti
    }
    if (!transaction.isValid()) {
      throw new Error('Cannot add invalid transaction to pool'); // Error noti
    }
    // Check balance for double spend prevention
    const balance = this.getBalanceOfAddress(transaction.fromAddress);
    if (balance < transaction.amount) {
      throw new Error('Not enough balance');
    }
    this.pendingTransactions.push(transaction);
    this.savePendingTransactions(); // Save pending transactions
  }

  // Mine pending transactions and reward miner
  minePendingTransactions(minerAddress) {
    const rewardTx = new Transaction(null, minerAddress, this.miningReward);
    this.pendingTransactions.push(rewardTx);

    const block = new Block(
      this.chain.length,
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash,
      this.difficulty
    );
    block.mineBlock();

    console.log('Block successfully mined!');
    this.chain.push(block);
    this.pendingTransactions = [];
    this.saveChainToDisk();
    this.savePendingTransactions(); // Clear saved pending transactions
  }

  // Get balance by scanning chain 
  getBalanceOfAddress(address) {
    let balance = 0;
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.fromAddress === address) {
          balance -= tx.amount;
        }
        if (tx.toAddress === address) {
          balance += tx.amount;
        }
      }
    }
    return balance;
  }

  // Verify integrity of the chain (hash links and signatures)
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const prevBlock = this.chain[i - 1];

      // Check block hash is correct
      if (currentBlock.hash !== currentBlock.computeHash()) {
        return false;
      }
      // Check previous block hash link
      if (currentBlock.previousHash !== prevBlock.hash) {
        return false;
      }
      // Check all transactions are valid (signed)
      for (const tx of currentBlock.transactions) {
        if (!tx.isValid()) {
          return false;
        }
      }
      // Check timestamp ordering
      if (currentBlock.timestamp < prevBlock.timestamp) {
        return false;
      }
    }
    return true;
  }

  // Save chain to disk as JSON
  saveChainToDisk() {
    fs.writeFileSync('chain.json', JSON.stringify(this.chain, null, 2));
  }

  // Save pending transactions
  savePendingTransactions() {
    fs.writeFileSync('pending.json', JSON.stringify(this.pendingTransactions, null, 2));
  }

  // Load chain from disk if available
  loadChainFromDisk() {
    if (fs.existsSync('chain.json')) {
      const data = fs.readFileSync('chain.json');
      const jsonChain = JSON.parse(data);
      // Reconstruct Block and Transaction objects properly
      this.chain = jsonChain.map(b => {
        // Reconstruct transactions as Transaction objects
        const transactions = b.transactions.map(tx => {
          const transaction = new Transaction(tx.fromAddress, tx.toAddress, tx.amount);
          transaction.timestamp = tx.timestamp;
          transaction.signature = tx.signature;
          return transaction;
        });
        
        const block = new Block(b.index, b.timestamp, transactions, b.previousHash, b.difficulty);
        block.hash = b.hash;
        block.nonce = b.nonce;
        return block;
      });
    }

    // Load pending transactions
    if (fs.existsSync('pending.json')) {
      const data = fs.readFileSync('pending.json');
      const jsonPending = JSON.parse(data);
      this.pendingTransactions = jsonPending.map(tx => {
        const transaction = new Transaction(tx.fromAddress, tx.toAddress, tx.amount);
        transaction.timestamp = tx.timestamp;
        transaction.signature = tx.signature;
        return transaction;
      });
    }
  }
}

module.exports = Blockchain;