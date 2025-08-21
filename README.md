A fully functional blockchain implementation with Proof-of-Work consensus, peer-to-peer networking, and digital wallet functionality built using Node.JS

## Architecture Overview

This blockchain implementation consists of:

- **Block Structure**: Cryptographically linked blocks with transaction data
- **Proof-of-Work Consensus**: Mining mechanism with adjustable difficulty
- **Transaction System**: Digital signatures and double-spend prevention
- **P2P Network**: WebSocket-based node communication and synchronization
- **Wallet System**: EC key pair generation and transaction signing
- **CLI Interface**: Command-line tools for blockchain interaction
- **Data Persistence**: JSON-based storage with automatic save/load

## Project Structure

```
S4043907---Blockchain-Fundamental-A2/
├── block.js           # Block data structure and mining logic
├── blockchain.js      # Main blockchain class with validation
├── transaction.js     # Transaction handling and digital signatures
├── wallet.js          # Cryptographic key pair generation
├── p2p.js            # Peer-to-peer networking functionality
├── cli.js            # Command-line interface
├── p2p_test_script.js # P2P network testing
└── README.md         # This file
```

## Getting Started

### Prerequisites

- Node.js 
- npm package manager

### Installation

1. Clone or download this repository
2. Navigate to the project directory
3. Install dependencies:
```bash
npm install ws crypto
```

### Basic Usage

#### 1. Create Wallets
```bash
node cli.js createwallet alice
node cli.js createwallet bob
```

#### 2. Mine Initial Coins
```bash
node cli.js mine alice_public.pem
```

#### 3. Send Transactions
```bash
node cli.js send alice_private.pem bob_public.pem 25
```

#### 4. Mine Transaction Block
```bash
node cli.js mine bob_public.pem
```

#### 5. Check Balances
```bash
node cli.js balance alice_public.pem
node cli.js balance bob_public.pem
```

## Peer-to-Peer Network

### Starting Nodes

#### Single Node
```bash
node cli.js startnode 6001
```

#### Multiple Connected Nodes
```bash
# Terminal 1
node cli.js startnode 6001

# Terminal 2
node cli.js startnode 6002 localhost:6001

# Terminal 3
node cli.js startnode 6003 localhost:6001,localhost:6002
```

### Network Features

- **Automatic Chain Synchronization**: Nodes adopt the longest valid chain
- **Transaction Broadcasting**: Transactions propagate across the network
- **Block Propagation**: Newly mined blocks are shared with all peers

## CLI Commands

| Command | Description | Usage |
|---------|-------------|--------|
| `createwallet` | Generate new key pair | `node cli.js createwallet <name>` |
| `mine` | Mine pending transactions | `node cli.js mine <minerPublicKey>` |
| `send` | Create and send transaction | `node cli.js send <fromPrivate> <toPublic> <amount>` |
| `balance` | Check address balance | `node cli.js balance <publicKey>` |
| `showchain` | Display full blockchain | `node cli.js showchain` |
| `showpending` | Show pending transactions | `node cli.js showpending` |
| `startnode` | Start P2P node | `node cli.js startnode <port> [peers]` |

##  Testing

### P2P Network Testing
```bash
node p2p_test_script.js
```

##  Security Features

### Cryptographic Security
- **SHA-256 Hashing**: All blocks and transactions use cryptographic hashes
- **Digital Signatures**: ECDSA signatures prevent unauthorized transactions
- **Chain Integrity**: Tampering with any block invalidates the entire chain

### Double-Spend Prevention
- **Balance Verification**: Transactions validate sender has sufficient funds
- **Transaction History**: Complete ledger prevents duplicate spending
- **Consensus Rules**: Network agrees on valid transaction ordering

### Network Security
- **Chain Validation**: Nodes reject invalid blocks and chains
- **Signature Verification**: All transactions must be properly signed
- **Longest Chain Rule**: Network converges on the chain with most work

## Configuration

### Mining Difficulty
Adjustable in `blockchain.js`:
```javascript
this.difficulty = 2; // Number of leading zeros required
```

### Mining Reward
Configurable in `blockchain.js`:
```javascript
this.miningReward = 50; // Coins awarded per block
```

### Network Ports
Default P2P ports start at 6001, customizable via CLI

## Troubleshooting

### Common Issues

**Transaction Rejected**
   - Verify sender has sufficient balance
   - Ensure transaction is properly signed
   - Check wallet files exist and are readable

## Data Persistence

The blockchain automatically saves to disk:
- `chain.json`: Complete blockchain state
- `pending.json`: Unconfirmed transactions
- `*_private.pem`: Private keys (keep secure!)
- `*_public.pem`: Public keys/addresses
