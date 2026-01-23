# 🎰 Spin2x - Web3 Spin Wheel Game

<p align="center">
  <strong>A decentralized spin-the-wheel game built with React Native & Solidity</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-Expo-blue?style=flat-square&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/Blockchain-Monad-purple?style=flat-square&logo=ethereum" alt="Monad" />
  <img src="https://img.shields.io/badge/Wallet-MetaMask-orange?style=flat-square&logo=metamask" alt="MetaMask" />
  <img src="https://img.shields.io/badge/WalletConnect-v2-3B99FC?style=flat-square" alt="WalletConnect" />
</p>

---

## ✨ Features

| Feature                        | Description                                        |
| ------------------------------ | -------------------------------------------------- |
| 🦊 **MetaMask + WalletConnect** | Connect via MetaMask Mobile using WalletConnect v2 |
| 🎡 **Animated Wheel**           | Smooth spin animation with 6 segments              |
| ⛓️ **On-chain Randomness**      | Fair result via `keccak256(blockhash, sender)`     |
| 💸 **Instant Payouts**          | Single transaction for stake + spin + payout       |

---

## 🎮 Game Rules

```
┌─────────────────────────────────────────────────────────┐
│  1. Connect wallet (MetaMask Mobile via WalletConnect)  │
│  2. Enter stake amount in native token                  │
│  3. Tap SPIN → transaction sent                         │
│  4. Wheel spins → result determined on-chain            │
│  5. Payout = Stake × Multiplier                         │
└─────────────────────────────────────────────────────────┘
```

**Wheel Segments:**

| 🔴 0x  | 🔴 0x  |   🟡 1.0x   | 🟢 1.2x | 🔵 1.5x |   🟣 2.0x    |
| :---: | :---: | :--------: | :----: | :----: | :---------: |
| Lose  | Lose  | Break-even |  +20%  |  +50%  | **2x Win!** |

---

## 🚀 Quick Start

### Prerequisites

- ✅ Node.js 16+
- ✅ [Expo Go](https://expo.dev/client) on your phone
- ✅ [MetaMask Mobile](https://metamask.io/download/)
- ✅ [WalletConnect Project ID](https://cloud.walletconnect.com) (free)

### Step 1: Install

```bash
git clone https://github.com/jatin-encrypted/Spin2x-Dapp.git
cd Spin2x-Dapp
npm install
```

### Step 2: Configure WalletConnect

Get your Project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com), then update `App.js`:

```javascript
const projectId = 'YOUR_PROJECT_ID';
```

### Step 3: Deploy Contract

```bash
cd contracts
npm install
echo "PRIVATE_KEY=your_private_key" > .env
npm run deploy:monad   # or deploy:sepolia, deploy:base
```

> 📖 See [`contracts/README.md`](./contracts/README.md) for detailed deployment guide.

### Step 4: Configure Contract Address

Update `src/config/contract.js`:

```javascript
export const CONTRACT_ADDRESS = '0xYourDeployedAddress';
```

### Step 5: Run

```bash
npx expo start --tunnel
```

Scan QR with **Expo Go** → Play! 🎉

---

## 📁 Project Structure

```
Spin2x-Dapp/
├── 📱 App.js                    # Entry point
├── 📜 contracts/                # Smart contract (Hardhat)
│   ├── contracts/SpinWheel.sol  # Game logic
│   ├── scripts/deploy.js        # Deployment script
│   └── README.md                # Deployment guide
└── 🎨 src/
    ├── components/              # SpinWheel UI
    ├── screens/                 # WalletConnect, SpinScreen
    ├── hooks/                   # useWallet, useSpinWheel
    ├── config/                  # Contract address & ABI
    └── utils/                   # Helpers
```

---

## 💰 Funding the Contract

The contract holds funds to pay winners. Send native tokens directly to the contract address.

```
📊 Max payout per spin = stake × 2.0
💡 Recommended balance = daily_volume × 2.0 × safety_margin
```

---

## 🛠️ Tech Stack

| Layer              | Technology                         |
| ------------------ | ---------------------------------- |
| **Mobile App**     | React Native + Expo                |
| **Wallet**         | MetaMask Mobile + WalletConnect v2 |
| **Blockchain**     | ethers.js                          |
| **Smart Contract** | Solidity 0.8.20                    |
| **Tooling**        | Hardhat                            |
| **Network**        | Monad Testnet (primary)            |

---

## 📄 License

MIT © 2026

---

<p align="center">
  Built with ❤️
</p>