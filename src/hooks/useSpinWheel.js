import { useState, useCallback, useMemo, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';

const RPC_URL = 'https://testnet-rpc.monad.xyz';

/**
 * Custom hook for interacting with SpinWheel smart contract
 * 
 * Provides:
 * - spin() function call
 * - Event parsing
 * - Error handling for contract interactions
 */
export const useSpinWheel = (wallet) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [spinError, setSpinError] = useState(null);

    // Reuse one provider to avoid flooding the RPC / socket churn on mobile.
    const fallbackProviderRef = useRef(null);
    if (!fallbackProviderRef.current) {
        fallbackProviderRef.current = new ethers.providers.JsonRpcProvider(RPC_URL);
    }

    const rpcProvider = wallet?.provider || fallbackProviderRef.current;
    const readContract = useMemo(
        () => new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, rpcProvider),
        [rpcProvider]
    );

    /**
     * Execute spin transaction
     * @param {string} stakeAmount - Stake amount in MON (e.g., "1.0")
     * @returns {Object} Spin result with segment, payout, txHash
     */
    const spin = useCallback(async (stakeAmount) => {
        if (!wallet.isConnected) {
            throw new Error('Wallet not connected');
        }

        if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
            throw new Error('Invalid stake amount');
        }

        try {
            setIsSpinning(true);
            setSpinError(null);

            // Convert stake to wei
            const stakeWei = ethers.utils.parseEther(stakeAmount);

            // Check if user has sufficient balance
            const userBalanceWei = ethers.utils.parseEther(wallet.balance);
            if (userBalanceWei.lt(stakeWei)) {
                throw new Error('Insufficient balance');
            }

            console.log('=== Spin Hook: Preparing Transaction ===');
            console.log('Stake amount (MON):', stakeAmount);
            console.log('Stake amount (wei):', stakeWei.toString());

            // Prepare transaction
            const iface = new ethers.utils.Interface(CONTRACT_ABI);
            const calldata = iface.encodeFunctionData('spin');
            console.log('Spin calldata:', calldata);

            const transaction = {
                to: CONTRACT_ADDRESS,
                value: stakeWei.toString(),
                data: calldata,
            };

            console.log('Transaction to send:', transaction);

            // Send transaction and wait for confirmation
            console.log('Calling wallet.sendTransaction...');
            const receipt = await wallet.sendTransaction(transaction);

            console.log('Receipt returned:', receipt);

            // Check if transaction is pending (sent to MetaMask)
            if (receipt.status === 'pending') {
                console.log('Transaction status: PENDING - MetaMask deep link sent');
                setIsSpinning(false);
                return {
                    success: false,
                    status: 'pending',
                    message: receipt.message,
                };
            }

            console.log('Parsing SpinResult event from receipt...');
            // Parse SpinResult event from receipt
            const result = parseSpinResult(receipt);

            console.log('Parsed result:', result);

            setIsSpinning(false);

            // Refresh wallet balance after transaction
            if (wallet.fetchBalance) {
                console.log('Refreshing wallet balance...');
                await wallet.fetchBalance();
            }

            return {
                success: true,
                segment: result.segment,
                payout: result.payout,
                stake: result.stake,
                txHash: receipt.transactionHash,
            };
        } catch (err) {
            console.error('Spin error:', err);
            setIsSpinning(false);

            // Parse error message
            let errorMessage = 'Transaction failed';

            if (err.message.includes('user rejected')) {
                errorMessage = 'Transaction rejected';
            } else if (err.message.includes('insufficient funds')) {
                errorMessage = 'Insufficient balance';
            } else if (err.message.toLowerCase().includes('contract has insufficient funds')) {
                errorMessage = 'Contract has insufficient funds';
            } else if (err.message) {
                errorMessage = err.message;
            }

            setSpinError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [wallet]);

    /**
     * Parse SpinResult event from transaction receipt
     * @param {Object} receipt - Transaction receipt
     * @returns {Object} Parsed spin result
     */
    const parseSpinResult = (receipt) => {
        try {
            // Check if receipt has logs
            if (!receipt.logs || receipt.logs.length === 0) {
                throw new Error('No logs in receipt');
            }

            // Create contract interface for parsing logs
            const iface = new ethers.utils.Interface(CONTRACT_ABI);

            // Find SpinResult event in logs
            const spinResultLog = receipt.logs.find(log => {
                try {
                    const parsed = iface.parseLog(log);
                    return parsed.name === 'SpinResult';
                } catch {
                    return false;
                }
            });

            if (!spinResultLog) {
                throw new Error('SpinResult event not found in transaction');
            }

            // Parse the event
            const parsedLog = iface.parseLog(spinResultLog);

            return {
                player: parsedLog.args.player,
                stake: ethers.utils.formatEther(parsedLog.args.stake),
                segment: parsedLog.args.segment.toNumber(),
                payout: ethers.utils.formatEther(parsedLog.args.payout),
                timestamp: parsedLog.args.timestamp.toNumber(),
            };
        } catch (err) {
            console.error('Event parsing error:', err);
            throw new Error('Failed to parse spin result');
        }
    };

    /**
     * Get contract balance
     * @returns {string} Contract balance in MON
     */
    const getContractBalance = useCallback(async () => {
        try {
            const balanceWei = await rpcProvider.getBalance(CONTRACT_ADDRESS);
            const balance = ethers.utils.formatEther(balanceWei);

            return balance;
        } catch (err) {
            console.error('Contract balance fetch error:', err);
            return '0';
        }
    }, [rpcProvider]);

    /**
     * Get recent spin results for an account
     * Used to fetch result after MetaMask transaction
     */
    const getRecentSpinResult = useCallback(async (userAddress) => {
        try {
            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            // Helper for retrying transient RPC failures
            const rpcWithRetry = async (fn, label = 'RPC call') => {
                const maxRetries = 3;
                for (let attempt = 0; attempt <= maxRetries; attempt++) {
                    try {
                        return await fn();
                    } catch (err) {
                        const msg = (err?.message || '').toLowerCase();
                        const transient =
                            msg.includes('missing response') ||
                            msg.includes('timeout') ||
                            msg.includes('server_error') ||
                            msg.includes('bad response');

                        if (!transient || attempt === maxRetries) throw err;

                        console.log(`${label} failed (attempt ${attempt + 1}), retrying...`);
                        // Exponential backoff: 500ms, 1000ms, 2000ms
                        await sleep(500 * Math.pow(2, attempt));
                    }
                }
            };

            // Get recent blocks to search for events (with retry)
            const currentBlock = await rpcWithRetry(
                () => rpcProvider.getBlockNumber(),
                'getBlockNumber'
            );
            // Monad RPC limits eth_getLogs to a 100-block range, so we must chunk.
            // We only need a short lookback since the user just spun.
            const lookbackBlocks = 200;
            const chunkSize = 100;
            const minBlock = Math.max(currentBlock - lookbackBlocks, 0);

            console.log(`Searching for SpinResult events from block ${minBlock} to ${currentBlock} (current block: ${currentBlock})`);

            // Query SpinResult events for this user in <=100 block windows (scan newest -> oldest)
            const filter = readContract.filters.SpinResult(userAddress);
            let latestEvent = null;

            const queryWithRetry = async (fromBlock, toBlock) => {
                return rpcWithRetry(
                    () => readContract.queryFilter(filter, fromBlock, toBlock),
                    `queryFilter(${fromBlock}-${toBlock})`
                );
            };

            for (let toBlock = currentBlock; toBlock >= minBlock; toBlock -= chunkSize) {
                const fromBlock = Math.max(toBlock - (chunkSize - 1), minBlock);
                console.log(`Querying SpinResult in block range ${fromBlock}-${toBlock} for ${userAddress}`);

                const events = await queryWithRetry(fromBlock, toBlock);
                console.log(`Found ${events.length} SpinResult events in block range ${fromBlock}-${toBlock}`);
                if (events.length > 0) {
                    latestEvent = events[events.length - 1];
                    console.log('Latest event found:', {
                        segment: latestEvent.args.segment?.toNumber?.(),
                        stake: ethers.utils.formatEther(latestEvent.args.stake),
                        payout: ethers.utils.formatEther(latestEvent.args.payout),
                        txHash: latestEvent.transactionHash,
                    });
                    break;
                }

                // Small delay so we don't hammer the RPC when polling.
                await sleep(150);

                if (fromBlock === minBlock) break;
            }

            if (!latestEvent) {
                console.log('No SpinResult events found in lookback window');
                return null;
            }

            return {
                player: latestEvent.args.player,
                stake: ethers.utils.formatEther(latestEvent.args.stake),
                segment: latestEvent.args.segment.toNumber(),
                payout: ethers.utils.formatEther(latestEvent.args.payout),
                timestamp: latestEvent.args.timestamp.toNumber(),
                txHash: latestEvent.transactionHash,
            };
        } catch (err) {
            console.error('Error fetching recent spin result:', err);
            return null;
        }
    }, [rpcProvider, readContract]);

    return {
        // Actions
        spin,
        getContractBalance,
        getRecentSpinResult,

        // State
        isSpinning,
        spinError,
        clearSpinError: () => setSpinError(null),
    };
};
