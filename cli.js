const Blockchain = require('./blockchain');
const Transaction = require('./transaction');
const { generateKeyPair } = require('./wallet');
const P2PServer = require('./p2p');

const myChain = new Blockchain();

// CLI command parsing
const args = process.argv.slice(2);
const command = args[0];

if (command === 'createwallet') { // Create Public and Private keys (node cli.js createwallet <name>)
  const name = args[1] || 'wallet';
  const { privateKey, publicKey } = generateKeyPair();
  const fs = require('fs');

  const privFile = `${name}_private.pem`;
  const pubFile = `${name}_public.pem`;

  fs.writeFileSync(privFile, privateKey, 'utf8');
  fs.writeFileSync(pubFile, publicKey, 'utf8');

  console.log(`Wallet created!`);
  console.log(`Private key saved to: ${privFile}`);
  console.log(`Public key saved to: ${pubFile}`);
}

if (command === 'send') { //Send transactions (node cli.js send <fromPrivateKeyFile> <toPublicKeyFile> <amount>)
  const fromPrivateKeyPath = args[1];
  const toPublicKeyPath = args[2];
  const amount = Number(args[3]);
  const fs = require('fs');
  
  try {
    // Read the private key for signing
    const privateKey = fs.readFileSync(fromPrivateKeyPath, 'utf8');
    
    // Read the public keys to use as addresses
    const fromPublicKey = fs.readFileSync(fromPrivateKeyPath.replace('_private.pem', '_public.pem'), 'utf8');
    const toPublicKey = fs.readFileSync(toPublicKeyPath, 'utf8');
    
    // Create transaction with public keys as addresses
    const tx = new Transaction(fromPublicKey, toPublicKey, amount);
    
    // Sign the transaction with private key
    tx.signTransaction(privateKey);
    
    // Add to transaction pool
    myChain.addTransaction(tx);
    console.log('Transaction added to pool');
    console.log('Transaction will be processed when the next block is mined');
  } catch (err) {
    console.log('Error:', err.message);
  }
}

if (command === 'mine') { //Mine blocks PoW (node cli.js mine <minerPublicKeyFile>)
  const minerPublicKeyPath = args[1];
  const fs = require('fs');
  
  try {
    const minerPublicKey = fs.readFileSync(minerPublicKeyPath, 'utf8');
    myChain.minePendingTransactions(minerPublicKey);
    console.log('New Balance:', myChain.getBalanceOfAddress(minerPublicKey));
  } catch (err) {
    console.log('Error reading miner public key:', err.message);
  }
}

if (command === 'balance') { // Get balance (node cli.js balance <publicKeyFile>)
  const publicKeyPath = args[1];
  const fs = require('fs');
  
  try {
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    console.log('Balance of address is', myChain.getBalanceOfAddress(publicKey));
  } catch (err) {
    console.log('Error reading public key:', err.message);
  }
}

if (command === 'showchain') {
  console.log(JSON.stringify(myChain.chain, null, 2));
}

if (command === 'showpending') {
  console.log('Pending transactions:');
  console.log(JSON.stringify(myChain.pendingTransactions, null, 2));
}

if (command === 'startnode') { // P2P Connectivity (node cli.js startnode <port> [peer1,peer2,...])
  const port = args[1] || 6001;
  const peers = args[2] ? args[2].split(',') : [];
  
  const p2p = new P2PServer(myChain);
  p2p.listen(port);
  
  // Connect to existing peers
  peers.forEach(peer => {
    console.log(`Connecting to peer: ${peer}`);
    p2p.connectToPeer(`ws://${peer}`);
  });
  
  console.log(`Node started on port ${port}`);
  console.log('Connected peers will be shown above');
  console.log('Use CTRL+C to stop.');
  
  // Show network status every 10 seconds
  setInterval(() => {
    const status = p2p.getNetworkStatus();
    console.log(`\nNetwork Status - Peers: ${status.connectedPeers}, Chain: ${status.chainLength}, Pending: ${status.pendingTransactions}`);
  }, 10000);
}

if (command === 'connect') {
  // node cli.js connect <peerAddress>
  const peerAddress = args[1];
  if (!peerAddress) {
    console.log('Usage: node cli.js connect <host:port>');
    process.exit(1);
  }
  
  const p2p = new P2PServer(myChain);
  p2p.connectToPeer(`ws://${peerAddress}`);
  console.log(`Attempting to connect to ${peerAddress}`);
}