# 🎰 Spin2x

<p align="center">
  <strong>A decentralized spin-the-wheel game built on Monad</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-Expo_SDK_54-61DAFB?style=for-the-badge&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity" alt="Solidity" />
  <img src="https://img.shields.io/badge/Monad-Testnet-8B5CF6?style=for-the-badge" alt="Monad" />
  <img src="https://img.shields.io/badge/ethers.js-5.7.2-2535A0?style=for-the-badge" alt="ethers.js" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/Version-1.0.0-blue?style=flat-square" alt="Version" />
</p>

---

## 📱 Mobile App

| Resource           | Link                                                                      |
| ------------------ | ------------------------------------------------------------------------- |
| 📺 **YouTube Demo** | [Watch App Demo](https://youtube.com/shorts/diSHnPQFUCA?feature=share)    |
| 📥 **Android APK**  | [Download APK](https://expo.dev/artifacts/eas/aeCZ1nhimDju5vZyfo2DRv.apk) |

---

## 🌐 Web App

| Resource           | Link                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------- |
| 🔗 **Live Website** | [production-spin2x-0h.tyzo.nodeops.app](https://production-spin2x-0h.tyzo.nodeops.app) |

---

## ✨ Features

| Feature                    | Description                                                           |
| -------------------------- | --------------------------------------------------------------------- |
| 🎡 **Animated Spin Wheel**  | Smooth SVG-based wheel with 6 segments and custom easing animation    |
| 🦊 **MetaMask Integration** | Browser extension (web) + deep-link signing (mobile via manual input) |
| ⛓️ **On-chain Randomness**  | Fair result generation via `keccak256(blockhash, sender)`             |
| 💸 **Instant Payouts**      | Single transaction: stake → spin → payout in one atomic operation     |
| 📱 **Cross-Platform**       | Native mobile (iOS/Android) + Web with shared codebase                |
| 🐳 **Docker Ready**         | Production-ready containerized deployment                             |

---

## 🎮 How It Works

```
┌───────────────────────────────────────────────────────────────┐
│  1. Connect Wallet                                            │
│     • Web: MetaMask browser extension (auto chain switch)     │
│     • Mobile: Manual address input + MetaMask deep-link       │
│                                                               │
│  2. Enter Stake (in MON tokens)                               │
│                                                               │
│  3. Tap SPIN → Transaction sent to smart contract             │
│                                                               │
│  4. Contract generates random segment using blockhash         │
│                                                               │
│  5. Wheel animates → Payout sent automatically                │
└───────────────────────────────────────────────────────────────┘
```

### Wheel Segments & Multipliers

| Segment     | 🔴 0×   | 🔴 0×   | 🟢 1.0×     | 🔵 1.2× | 🟣 1.5× | 🟡 2.0×      |
| ----------- | ------ | ------ | ---------- | ------ | ------ | ----------- |
| Result      | Lose   | Lose   | Break-even | +20%   | +50%   | **Double!** |
| Probability | 16.67% | 16.67% | 16.67%     | 16.67% | 16.67% | 16.67%      |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Expo)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐ │
│  │  SpinWheel  │  │ SpinScreen  │  │  WalletConnectScreen     │ │
│  │  Component  │  │             │  │                          │ │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬─────────────┘ │
│         │                │                      │               │
│  ┌──────┴────────────────┴──────────────────────┴─────────────┐ │
│  │                     Hooks Layer                             │ │
│  │  useSpinWheel (contract calls)  │  useWallet (connections)  │ │
│  └──────────────────────────────────┬──────────────────────────┘ │
└─────────────────────────────────────┼───────────────────────────┘
                                      │ ethers.js
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Monad Testnet (Chain ID: 10143)              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  SpinWheel.sol @ 0x2F4613edDb2e8C976fA3457C7E8d10a1d4eeaE53│ │
│  │  • spin() payable - execute spin with stake                │ │
│  │  • SpinResult event - emits segment, payout, timestamp     │ │
│  │  • getBalance() - check contract balance                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version | Purpose            |
| ----------- | ------- | ------------------ |
| Node.js     | 18+     | Runtime            |
| npm/yarn    | Latest  | Package manager    |
| Expo CLI    | Latest  | Mobile development |
| MetaMask    | Latest  | Web3 wallet        |

### 1. Clone & Install

```bash
git clone https://github.com/jatin-encrypted/Spin2x-Dapp.git
cd Spin2x-Dapp
npm install
```

### 2. Run Development Server

```bash
# Start Expo development server
npx expo start

# Run on specific platform
npx expo start --web      # Browser
npx expo start --android  # Android (requires emulator or device)
npx expo start --ios      # iOS (requires macOS + Xcode)
```

### 3. Connect & Play

1. Open app in browser or scan QR with Expo Go
2. Click "Connect Wallet"
3. Approve MetaMask connection (auto-switches to Monad Testnet)
4. Enter stake amount and spin!

---

## 🌐 Web Deployment

### Docker (Recommended)

```bash
# Build web bundle
npx expo export --platform web

# Build Docker image
docker build -t spin2x .

# Run container
docker run -p 3000:3000 spin2x
```

### Manual Deployment

```bash
# Export static web build
npx expo export --platform web

# Serve with Node.js
node server.js
```

The included `server.js` provides:
- Static file serving from `/dist`
- SPA routing (all routes → `index.html`)
- Health check endpoint (`/health`)
- Proper MIME type handling

---

## 📜 Smart Contract

### Deployment

```bash
cd contracts
npm install

# Create environment file
echo "PRIVATE_KEY=your_private_key_here" > .env

# Deploy to Monad Testnet
npm run deploy:monad

# Or deploy to other networks
npm run deploy:sepolia   # Ethereum Sepolia
npm run deploy:base      # Base Sepolia
npm run deploy:amoy      # Polygon Amoy
```

### Current Deployment

| Property     | Value                                        |
| ------------ | -------------------------------------------- |
| **Network**  | Monad Testnet                                |
| **Chain ID** | 10143                                        |
| **Contract** | `0x2F4613edDb2e8C976fA3457C7E8d10a1d4eeaE53` |
| **RPC URL**  | `https://testnet-rpc.monad.xyz`              |

### Contract Interface

```solidity
// Execute spin with stake
function spin() external payable;

// Get contract balance (for payout pool)
function getBalance() external view returns (uint256);

// Emitted on every spin
event SpinResult(
    address indexed player,
    uint256 stake,
    uint8 segment,      // 0-5
    uint256 payout,
    uint256 timestamp
);
```

### Funding the Contract

The contract needs funds to pay winners. Send MON directly to the contract address:

```
Max payout per spin = stake × 2.0
Recommended balance = expected_daily_volume × 2.0 × safety_margin
```

---

## 📁 Project Structure

```
spin2x/
├── App.js                       # Entry point with WalletProvider
├── server.js                    # Node.js static server for web
├── Dockerfile                   # Production container config
├── package.json                 # Dependencies & scripts
├── app.json                     # Expo configuration
├── eas.json                     # EAS Build configuration
│
├── src/
│   ├── components/
│   │   ├── SpinWheel.js         # Animated SVG wheel component
│   │   ├── WalletConnectModal.js
│   │   └── WalletAddressModal.js
│   │
│   ├── screens/
│   │   ├── WalletConnectScreen.js  # Landing/connection screen
│   │   └── SpinScreen.js           # Main game screen
│   │
│   ├── hooks/
│   │   ├── useWallet.js         # Wallet connection & state
│   │   └── useSpinWheel.js      # Contract interaction logic
│   │
│   ├── config/
│   │   └── contract.js          # Contract address & ABI
│   │
│   └── utils/
│       └── helpers.js           # Utility functions
│
├── contracts/
│   ├── contracts/
│   │   └── SpinWheel.sol        # Game smart contract
│   ├── scripts/
│   │   ├── deploy.js            # Deployment script
│   │   └── fundContract.js      # Funding helper
│   ├── hardhat.config.js        # Multi-network config
│   └── deployment-info.json     # Latest deployment details
│
└── assets/
    ├── icon.png                 # App icon
    ├── splash.png               # Splash screen
    └── adaptive-icon.png        # Android adaptive icon
```

---

## 🛠️ Tech Stack

| Layer                | Technology            | Version     |
| -------------------- | --------------------- | ----------- |
| **Framework**        | React Native + Expo   | SDK 54      |
| **Web3**             | ethers.js             | 5.7.2       |
| **Smart Contract**   | Solidity              | 0.8.20      |
| **Contract Tooling** | Hardhat               | 2.19.4      |
| **Blockchain**       | Monad Testnet         | Chain 10143 |
| **UI Components**    | react-native-svg      | 15.12.1     |
| **State**            | React Context + Hooks | React 19.1  |
| **Storage**          | AsyncStorage          | 2.2.0       |
| **Container**        | Docker + Node.js 20   | Alpine      |

---

## 🔧 Configuration

### Update Contract Address

After deploying your own contract, update [src/config/contract.js](src/config/contract.js):

```javascript
export const CONTRACT_ADDRESS = '0xYourNewContractAddress';
```

### Network Configuration

The app is pre-configured for Monad Testnet. To use a different network, update:

1. `src/config/contract.js` - RPC URL and chain config
2. `src/hooks/useWallet.js` - Chain ID and network params
3. `contracts/hardhat.config.js` - Deployment network

---

## 📱 Building for Production

### Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

### iOS (requires Apple Developer account)

```bash
eas build --platform ios --profile production
```

---

## 📄 License

MIT © 2026 — See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with ❤️ on Monad</strong>
</p>
