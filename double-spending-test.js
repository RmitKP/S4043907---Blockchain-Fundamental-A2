const Blockchain = require('./blockchain');
const Transaction = require('./transaction');
const { generateKeyPair } = require('./wallet');

console.log('=== DOUBLE-SPEND PREVENTION TEST ===\n');

const blockchain = new Blockchain();

try {
  // Create test wallets
  const alice = generateKeyPair();
  const bob = generateKeyPair();
  const charlie = generateKeyPair();

  // Give Alice initial coins
  console.log('1. Alice mines');
  blockchain.minePendingTransactions(alice.publicKey);
  console.log(`Alice's balance: ${blockchain.getBalanceOfAddress(alice.publicKey)} coins`);

  // Create legitimate transaction
  console.log('\n2. Alice sends 30 coins to Bob');
  const tx1 = new Transaction(alice.publicKey, bob.publicKey, 30);
  tx1.signTransaction(alice.privateKey);
  blockchain.addTransaction(tx1);
  console.log('Transaction added to pending pool');

  // Attempt double-spend attack
  console.log('\n3. Alice attempts to double spend same 30 coins to Charlie');
  const tx2 = new Transaction(alice.publicKey, charlie.publicKey, 30);
  tx2.signTransaction(alice.privateKey);
  
  try {
    blockchain.addTransaction(tx2);
    console.log('Double spend test failed, attack succeeded');
  } catch (error) {
    console.log('Double-spend attack prevented!');
    console.log(`   Reason: ${error.message}`);
  }

  console.log('\nTest complete');

} catch (error) {
  console.error('Test failed:', error.message);
}