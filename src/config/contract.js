/**
 * Smart Contract Configuration
 **/

// Contract address - Deployed on Monad Testnet
export const CONTRACT_ADDRESS = '0x2F4613edDb2e8C976fA3457C7E8d10a1d4eeaE53';

// Contract ABI - Only includes functions/events we use
export const CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "spin",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "player",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "stake",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint8",
                "name": "segment",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "payout",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "name": "SpinResult",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "getBalance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Network configuration for Monad
export const NETWORK_CONFIG = {
    chainId: '10143', // Update with Monad chain ID in hex
    chainName: 'Monad Testnet',
    rpcUrl: 'https://testnet-rpc.monad.xyz', // Update with actual Monad RPC URL
    blockExplorerUrl: 'https://testnet.monadvision.com', // Update with actual explorer URL
    nativeCurrency: {
        name: 'MON',
        symbol: 'MON',
        decimals: 18,
    },
};

/**
 * Validate contract configuration
 */
export const validateConfig = () => {
    if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
        console.warn('⚠️  Contract address not configured. Update src/config/contract.js');
        return false;
    }
    return true;
};
