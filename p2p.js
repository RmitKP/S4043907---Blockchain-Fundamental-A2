const WebSocket = require('ws');
const Block = require('./block');
const Transaction = require('./transaction');

class P2PServer {
  constructor(blockchain) {
    this.blockchain = blockchain;
    this.sockets = [];
  }

  listen(port) {
    const server = new WebSocket.Server({ port: port });
    server.on('connection', ws => this.connectSocket(ws));
    console.log(`WebSocket P2P server listening on port ${port}`);
  }

  connectSocket(socket) {
    this.sockets.push(socket);
    console.log(`New peer connected. Total peers: ${this.sockets.length}`);
    
    // Send current chain to new peer
    this.sendChain(socket);

    socket.on('message', message => {
      try {
        const msg = JSON.parse(message);
        this.handleMessage(msg, socket);
      } catch (error) {
        console.error('Error parsing message:', error.message);
      }
    });

    socket.on('close', () => {
      this.sockets = this.sockets.filter(s => s !== socket);
      console.log(`Peer disconnected. Total peers: ${this.sockets.length}`);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error.message);
    });
  }

  handleMessage(msg, socket) {
    switch (msg.type) {
      case 'CHAIN':
        this.handleChainMessage(msg.data);
        break;
      case 'TRANSACTION':
        this.handleTransactionMessage(msg.data);
        break;
      case 'BLOCK':
        this.handleBlockMessage(msg.data);
        break;
      case 'REQUEST_CHAIN':
        this.sendChain(socket);
        break;
      default:
        console.log('Unknown message type:', msg.type);
    }
  }

  handleChainMessage(chainData) {
    try {
      // Reconstruct the chain with proper objects
      const newChain = chainData.map(b => {
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

      // Basic validation and replacement logic
      if (this.isValidChain(newChain) && newChain.length > this.blockchain.chain.length) {
        console.log('Replacing chain with longer valid chain from peer');
        this.blockchain.chain = newChain;
        this.blockchain.saveChainToDisk();
      } else if (newChain.length > this.blockchain.chain.length) {
        console.log('Received longer chain but it\'s invalid');
      }
    } catch (error) {
      console.error('Error handling chain message:', error.message);
    }
  }

  handleTransactionMessage(txData) {
    try {
      // Reconstruct transaction object
      const transaction = new Transaction(txData.fromAddress, txData.toAddress, txData.amount);
      transaction.timestamp = txData.timestamp;
      transaction.signature = txData.signature;

      // Validate and add transaction
      if (transaction.isValid()) {
        // Check if transaction already exists
        const exists = this.blockchain.pendingTransactions.some(tx => 
          tx.fromAddress === transaction.fromAddress &&
          tx.toAddress === transaction.toAddress &&
          tx.amount === transaction.amount &&
          tx.timestamp === transaction.timestamp
        );

        if (!exists) {
          try {
            this.blockchain.addTransaction(transaction);
            console.log('Transaction received and added from peer');
          } catch (error) {
            console.log('Transaction rejected:', error.message);
          }
        }
      } else {
        console.log('Invalid transaction received from peer');
      }
    } catch (error) {
      console.error('Error handling transaction message:', error.message);
    }
  }

  handleBlockMessage(blockData) {
    try {
      // Reconstruct block object
      const transactions = blockData.transactions.map(tx => {
        const transaction = new Transaction(tx.fromAddress, tx.toAddress, tx.amount);
        transaction.timestamp = tx.timestamp;
        transaction.signature = tx.signature;
        return transaction;
      });

      const newBlock = new Block(
        blockData.index, 
        blockData.timestamp, 
        transactions, 
        blockData.previousHash, 
        blockData.difficulty
      );
      newBlock.hash = blockData.hash;
      newBlock.nonce = blockData.nonce;

      // Validate block
      const latestBlock = this.blockchain.getLatestBlock();
      if (latestBlock.hash === newBlock.previousHash && 
          newBlock.hash === newBlock.computeHash() &&
          newBlock.index === latestBlock.index + 1) {
        
        console.log('Valid block received from peer, adding to chain');
        this.blockchain.chain.push(newBlock);
        
        // Remove transactions that are now in the block
        this.blockchain.pendingTransactions = this.blockchain.pendingTransactions.filter(tx => {
          return !newBlock.transactions.some(blockTx => 
            blockTx.fromAddress === tx.fromAddress &&
            blockTx.toAddress === tx.toAddress &&
            blockTx.amount === tx.amount &&
            blockTx.timestamp === tx.timestamp
          );
        });
        
        this.blockchain.saveChainToDisk();
        this.blockchain.savePendingTransactions();
      } else {
        console.log('Invalid block received from peer');
      }
    } catch (error) {
      console.error('Error handling block message:', error.message);
    }
  }

  // Chain validation
  isValidChain(chain) {
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const prevBlock = chain[i - 1];

      if (currentBlock.hash !== currentBlock.computeHash()) {
        return false;
      }
      if (currentBlock.previousHash !== prevBlock.hash) {
        return false;
      }
    }
    return true;
  }

  // Send chain to a specific socket
  sendChain(socket) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ 
        type: 'CHAIN', 
        data: this.blockchain.chain 
      }));
    }
  }

  // Broadcast the full chain to all peers
  syncChain() {
    this.broadcast({ type: 'CHAIN', data: this.blockchain.chain });
  }

  // Broadcast a transaction to peers
  broadcastTransaction(transaction) {
    this.broadcast({ type: 'TRANSACTION', data: transaction });
  }

  // Broadcast a newly mined block to peers
  broadcastBlock(block) {
    this.broadcast({ type: 'BLOCK', data: block });
  }

  // Connect to another peer
  connectToPeer(peerAddress) {
    const ws = new WebSocket(peerAddress);
    
    ws.on('open', () => {
      console.log(`Connected to peer: ${peerAddress}`);
      this.connectSocket(ws);
    });

    ws.on('error', (error) => {
      console.error(`Failed to connect to peer ${peerAddress}:`, error.message);
    });
  }

  broadcast(message) {
    this.sockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error broadcasting to peer:', error.message);
        }
      }
    });
  }

  // Get network status
  getNetworkStatus() {
    return {
      connectedPeers: this.sockets.length,
      chainLength: this.blockchain.chain.length,
      pendingTransactions: this.blockchain.pendingTransactions.length
    };
  }
}

module.exports = P2PServer;