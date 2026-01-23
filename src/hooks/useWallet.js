import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { ethers } from 'ethers';
import { Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONTRACT_ABI } from '../config/contract';

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [balance, setBalance] = useState('0');
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [provider, setProvider] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);

    useEffect(() => {
        console.log('Initializing provider with RPC:', 'https://testnet-rpc.monad.xyz');
        const rpcProvider = new ethers.providers.JsonRpcProvider('https://testnet-rpc.monad.xyz');

        // Test the provider connection
        rpcProvider.getBlockNumber()
            .then(blockNumber => {
                console.log('Provider connected successfully. Current block:', blockNumber);
            })
            .catch(err => {
                console.error('Provider connection failed:', err);
            });

        setProvider(rpcProvider);
        restoreWallet();
    }, []);

    const restoreWallet = async () => {
        try {
            const savedAddress = await AsyncStorage.getItem('wallet_address');
            if (savedAddress) {
                setAccount(savedAddress);
            }
        } catch (err) {
            console.error('Failed to restore wallet:', err);
        }
    };

    const connectWallet = useCallback(async () => {
        try {
            setIsConnecting(true);
            setError(null);

            // Show the address input modal
            setShowAddressModal(true);
        } catch (err) {
            console.error('Connection error:', err);
            setError('Failed to connect wallet');
            setIsConnecting(false);
        }
    }, []);

    const handleAddressSubmit = async (address) => {
        setShowAddressModal(false);

        if (address && ethers.utils.isAddress(address)) {
            setAccount(address);
            await AsyncStorage.setItem('wallet_address', address);
            setIsConnecting(false);
            Alert.alert('Success', 'Wallet connected successfully!');
        } else {
            setError('Invalid wallet address');
            setIsConnecting(false);
            Alert.alert('Error', 'Invalid wallet address. Please try again.');
        }
    };

    const handleAddressCancel = () => {
        setShowAddressModal(false);
        setIsConnecting(false);
    };

    const disconnectWallet = useCallback(async () => {
        try {
            setAccount(null);
            setBalance('0');
            setError(null);
            await AsyncStorage.removeItem('wallet_address');
        } catch (err) {
            console.error('Disconnect error:', err);
            setError('Failed to disconnect wallet');
        }
    }, []);

    const fetchBalance = useCallback(async () => {
        if (!account || !provider) {
            console.log('Cannot fetch balance - account or provider missing:', { account, provider: !!provider });
            return;
        }

        try {
            console.log('Fetching balance for account:', account);
            console.log('Using RPC:', 'https://testnet-rpc.monad.xyz');

            const balanceWei = await provider.getBalance(account);
            console.log('Balance in Wei:', balanceWei.toString());

            const balanceFormatted = ethers.utils.formatEther(balanceWei);
            console.log('Balance formatted:', balanceFormatted, 'MON');

            setBalance(balanceFormatted);
        } catch (err) {
            console.error('Balance fetch error:', err);
            console.error('Error details:', err.message);
            setError('Failed to fetch balance: ' + err.message);
        }
    }, [account, provider]);

    const sendTransaction = useCallback(async (transaction) => {
        if (!account || !provider) {
            throw new Error('Wallet not connected');
        }

        try {
            console.log('=== Opening MetaMask to Sign Transaction ===');
            console.log('Transaction details:', transaction);

            const chainId = 10143; // Monad testnet
            const recipient = transaction.to;
            const valueWei = transaction.value;

            // Use ABI to generate calldata for spin() to avoid selector mismatches.
            const iface = new ethers.utils.Interface(CONTRACT_ABI);
            const data = transaction.data || iface.encodeFunctionData('spin');

            console.log('Encoded spin() calldata:', data);
            console.log('Value (wei):', valueWei);
            console.log('Recipient (contract):', recipient);

            // MetaMask deep link format that supports function calls:
            // https://metamask.app.link/send/{chainId}?to={to}&value={value}&data={data}
            // Or use the tx object format directly
            const txParams = {
                to: recipient,
                value: valueWei,
                data: data,
                chainId: `0x${chainId.toString(16)}`,
            };

            console.log('TX Params:', txParams);

            // Try the newer MetaMask deep link format with explicit chainId
            const encodedTxParams = encodeURIComponent(JSON.stringify(txParams));
            const metamaskUrl = `https://metamask.app.link/send?params=${encodedTxParams}`;

            console.log('MetaMask URL:', metamaskUrl);

            // Also prepare fallback direct link
            const directUrl = `https://metamask.app.link/send/${recipient}@${chainId}?value=${valueWei}&data=${data}`;
            console.log('Fallback URL:', directUrl);

            // Try to open MetaMask
            const canOpen = await Linking.canOpenURL(directUrl);

            if (canOpen) {
                console.log('MetaMask is available - opening deep link...');
                // Use the direct format which MetaMask mobile better supports
                await Linking.openURL(directUrl);

                Alert.alert(
                    'Complete in MetaMask',
                    'Please sign and confirm the transaction in MetaMask app.\n\nMake sure the calldata shows "spin" function.',
                    [
                        {
                            text: 'Refresh Balance',
                            onPress: async () => {
                                console.log('User tapped Refresh Balance after MetaMask');
                                await fetchBalance();
                            }
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel'
                        }
                    ]
                );

                console.log('Returning pending status - app will poll for results');
                return {
                    transactionHash: 'pending',
                    status: 'pending',
                    message: 'Transaction sent to MetaMask. Please confirm in the app.'
                };
            } else {
                // MetaMask not installed - fallback to demo mode
                console.warn('MetaMask not available. Falling back to DEMO MODE.');

                Alert.alert(
                    'MetaMask Not Found',
                    'Install MetaMask mobile app for real transactions. Running in demo mode.',
                    [{ text: 'OK' }]
                );

                await new Promise(resolve => setTimeout(resolve, 2000));

                const mockTxHash = '0x' + Array.from({ length: 64 }, () =>
                    Math.floor(Math.random() * 16).toString(16)
                ).join('');

                const segment = Math.floor(Math.random() * 6);
                const multipliers = [0, 0, 100, 120, 150, 200];
                const stakeWei = ethers.BigNumber.from(transaction.value);
                const payoutWei = stakeWei.mul(multipliers[segment]).div(100);

                console.log('DEMO MODE - generated mock result:', {
                    segment,
                    stake: ethers.utils.formatEther(stakeWei),
                    payout: ethers.utils.formatEther(payoutWei),
                    txHash: mockTxHash,
                });

                const mockReceipt = {
                    transactionHash: mockTxHash,
                    blockNumber: Math.floor(Math.random() * 1000000),
                    status: 1,
                    logs: [{
                        address: transaction.to,
                        topics: [
                            ethers.utils.id('SpinResult(address,uint256,uint8,uint256,uint256)'),
                            ethers.utils.hexZeroPad(account, 32)
                        ],
                        data: ethers.utils.defaultAbiCoder.encode(
                            ['uint256', 'uint8', 'uint256', 'uint256'],
                            [stakeWei, segment, payoutWei, Math.floor(Date.now() / 1000)]
                        )
                    }]
                };

                // Update balance locally (DEMO MODE only)
                const currentBalanceWei = ethers.utils.parseEther(balance);
                const newBalanceWei = currentBalanceWei.sub(stakeWei).add(payoutWei);
                setBalance(ethers.utils.formatEther(newBalanceWei));

                return mockReceipt;
            }
        } catch (err) {
            console.error('Transaction error:', err);
            throw err;
        }
    }, [account, provider, balance, fetchBalance]); const getTransactionReceipt = useCallback(async (txHash) => {
        if (!provider) {
            throw new Error('Provider not available');
        }

        try {
            const receipt = await provider.getTransactionReceipt(txHash);
            return receipt;
        } catch (err) {
            console.error('Receipt fetch error:', err);
            throw err;
        }
    }, [provider]);

    useEffect(() => {
        if (account && provider) {
            fetchBalance();
        }
    }, [account, provider, fetchBalance]);

    const value = {
        isConnected: !!account,
        isConnecting,
        account,
        balance,
        connectWallet,
        disconnectWallet,
        sendTransaction,
        getTransactionReceipt,
        fetchBalance,
        error,
        clearError: () => setError(null),
        provider,
        showAddressModal,
        handleAddressSubmit,
        handleAddressCancel,
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within WalletProvider');
    }
    return context;
};
