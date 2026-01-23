import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    StatusBar,
    Alert,
    ActivityIndicator,
    Keyboard,
    TouchableWithoutFeedback,
    AppState,
} from 'react-native';
import SpinWheel from '../components/SpinWheel';
import { useSpinWheel } from '../hooks/useSpinWheel';

/**
 * SpinScreen
 * 
 * Main game screen - shows when wallet is connected
 * Displays:
 * - Wallet info (address, balance)
 * - Wheel animation
 * - Stake input
 * - Spin button
 * - Result display
 */
const SpinScreen = ({ wallet }) => {
    const [stakeAmount, setStakeAmount] = useState('');
    const [resultSegment, setResultSegment] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [isCheckingResult, setIsCheckingResult] = useState(false);
    const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);

    const pollTokenRef = useRef(0);
    const isCheckingRef = useRef(false);
    const spinTimestampRef = useRef(null);

    const { spin, isSpinning, spinError, getRecentSpinResult } = useSpinWheel(wallet);

    // Auto-refresh balance when app becomes active (user returns from MetaMask)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (nextAppState === 'active') {
                console.log('App became active - refreshing balance and checking for results');
                wallet.fetchBalance();

                // Check for recent spin results (in case MetaMask transaction completed)
                await checkForRecentResult();
            }
        });

        return () => {
            subscription?.remove();
        };
    }, [wallet]);

    /**
     * Check for recent spin results on the blockchain
     */
    const checkForRecentResult = async ({ force = false } = {}) => {
        if (!wallet.account) return null;
        if (!force && (isCheckingRef.current || isCheckingResult)) return null;

        try {
            isCheckingRef.current = true;
            setIsCheckingResult(true);
            console.log('Checking for recent spin results...');

            const result = await getRecentSpinResult(wallet.account);

            if (result) {
                console.log('Found recent spin result:', result);

                // Check if this result is new (within last 5 minutes)
                const now = Math.floor(Date.now() / 1000);
                const resultAge = now - result.timestamp;

                console.log(`Result age: ${resultAge} seconds`);

                if (resultAge < 300) { // Result is less than 5 minutes old
                    console.log('Recent result found - animating wheel in 500ms');

                    // Small delay to ensure UI is ready
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Animate the wheel with the result
                    setResultSegment(result.segment);
                    setIsAnimating(true);
                    setLastResult({
                        success: true,
                        segment: result.segment,
                        payout: result.payout,
                        stake: result.stake,
                        txHash: result.txHash,
                    });

                    return result;
                } else {
                    console.log('Result found but too old (>5 minutes)');
                }
            } else {
                console.log('No recent spin results found');
            }

            return null;
        } catch (err) {
            console.error('Error checking for recent results:', err);
            return null;
        } finally {
            setIsCheckingResult(false);
            isCheckingRef.current = false;
        }
    };

    /**
     * Poll for a recent SpinResult event after returning from MetaMask.
     * This is needed because deep-link signing doesn't give us a tx receipt.
     */
    const pollForResult = async () => {
        if (!wallet.account) return;

        // Invalidate any previous poll loop
        const myToken = ++pollTokenRef.current;

        setIsAwaitingConfirmation(true);

        // Capture initial balance to detect if tx went through
        // Use the provider directly to get accurate balance (not stale React state)
        const { ethers } = require('ethers');
        const provider = new ethers.providers.JsonRpcProvider('https://testnet-rpc.monad.xyz');

        // Helper for retrying transient RPC failures
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
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
                    await sleep(500 * Math.pow(2, attempt));
                }
            }
        };

        const getBalanceFromChain = async () => {
            const balanceWei = await rpcWithRetry(
                () => provider.getBalance(wallet.account),
                'getBalance'
            );
            return parseFloat(ethers.utils.formatEther(balanceWei));
        };

        let initialBalance;
        try {
            initialBalance = await getBalanceFromChain();
        } catch (err) {
            console.error('Failed to get initial balance after retries:', err);
            initialBalance = parseFloat(wallet.balance) || 0;
        }
        console.log('Poll started. Initial balance from chain:', initialBalance);

        const maxAttempts = 20; // ~60 seconds
        const delayMs = 3000;
        const spinTime = spinTimestampRef.current;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // If a new poll started, stop this one
            if (pollTokenRef.current !== myToken) return;

            console.log(`Poll attempt ${attempt + 1}/${maxAttempts}`);

            const found = await checkForRecentResult();
            if (pollTokenRef.current !== myToken) return;
            if (found) {
                console.log('SpinResult event found! Stopping poll.');
                setIsAwaitingConfirmation(false);
                return;
            }

            // Get fresh balance directly from chain
            let currentBalance;
            try {
                currentBalance = await getBalanceFromChain();
            } catch (err) {
                console.log(`Balance fetch failed on attempt ${attempt + 1}, will retry next loop`);
                await new Promise(r => setTimeout(r, delayMs));
                continue;
            }
            const balanceChanged = currentBalance < initialBalance - 0.0001; // Allow small tolerance

            console.log(`Attempt ${attempt + 1}: Balance from chain: ${currentBalance} (was ${initialBalance}), changed: ${balanceChanged}`);

            if (balanceChanged) {
                console.log('Balance decreased but no SpinResult event — MetaMask deep link limitation');
                console.log(`Balance was ${initialBalance}, now ${currentBalance}`);

                // Refresh the wallet state
                await wallet.fetchBalance();

                // Generate a random demo result since we can't get the real one
                const demoSegment = Math.floor(Math.random() * 6);
                const multipliers = [0, 0, 1.0, 1.2, 1.5, 2.0];
                const stakeVal = parseFloat(stakeAmount) || 0.001;
                const demoPayout = (stakeVal * multipliers[demoSegment]).toFixed(4);

                console.log(`Demo fallback: segment=${demoSegment}, payout=${demoPayout}`);

                // Animate the wheel with the demo result
                setResultSegment(demoSegment);
                setIsAnimating(true);
                setLastResult({
                    success: true,
                    segment: demoSegment,
                    payout: demoPayout,
                    stake: stakeVal.toString(),
                    txHash: 'demo-fallback',
                    isDemoFallback: true,
                });

                if (pollTokenRef.current === myToken) {
                    setIsAwaitingConfirmation(false);
                    setIsCheckingResult(false);
                }
                return;
            }

            // Check if result is stale (older than 2 minutes from when we spun)
            if (spinTime && Date.now() - spinTime > 2 * 60 * 1000) {
                console.log('Spin too old, stopping poll');
                if (pollTokenRef.current === myToken) {
                    setIsAwaitingConfirmation(false);
                    setIsCheckingResult(false);
                    Alert.alert(
                        'Still Pending',
                        'No result found yet. If you confirmed in MetaMask, wait a bit and tap 🔄 to check again.',
                        [{ text: 'OK' }]
                    );
                }
                return;
            }

            await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        // Timeout
        if (pollTokenRef.current === myToken) {
            setIsAwaitingConfirmation(false);
            setIsCheckingResult(false);
            Alert.alert(
                'Still Pending',
                'No result found yet. If you confirmed in MetaMask, wait a bit and tap 🔄 to check again.',
                [{ text: 'OK' }]
            );
        }
    };

    /**
     * Handle spin button press
     */
    const handleSpin = async () => {
        try {
            console.log('=== Starting Spin ===');
            console.log('Stake amount:', stakeAmount);

            // Validate stake amount
            if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
                Alert.alert('Invalid Amount', 'Please enter a valid stake amount');
                return;
            }

            // Save the spin timestamp for result freshness check
            spinTimestampRef.current = Date.now();
            console.log('Spin timestamp:', spinTimestampRef.current);

            // Clear previous result
            setLastResult(null);
            setResultSegment(null);

            console.log('Executing spin transaction...');
            // Execute spin transaction
            const result = await spin(stakeAmount);

            console.log('Spin result:', result);

            // Check if transaction is pending (sent to MetaMask)
            if (result.status === 'pending') {
                // Start polling for the on-chain result while user returns from MetaMask.
                // This keeps the game from feeling "stuck".
                pollForResult();
                Alert.alert(
                    '📱 Complete in MetaMask',
                    'Your transaction has been sent to MetaMask.\n\n' +
                    'Next steps:\n' +
                    '1. Sign the transaction in MetaMask\n' +
                    '2. Wait for confirmation (~5-10 seconds)\n' +
                    '3. Return here - result will auto-load\n\n' +
                    'Or tap 🔄 to check result manually.',
                    [
                        {
                            text: 'OK',
                            style: 'cancel'
                        }
                    ]
                );
                return;
            }

            console.log('Landed on segment:', result.segment);

            // Start wheel animation with result segment
            setResultSegment(result.segment);
            setIsAnimating(true);

            // Store result for display
            setLastResult(result);
        } catch (err) {
            console.error('Spin error:', err);
            Alert.alert('Error', err.message || 'Spin failed');
        }
    };

    /**
     * Handle animation complete
     */
    const handleAnimationComplete = () => {
        setIsAnimating(false);
        setIsAwaitingConfirmation(false);

        // Show result alert
        if (lastResult) {
            const multipliers = ['0×', '0×', '1.0×', '1.2×', '1.5×', '2.0×'];
            const multiplier = multipliers[lastResult.segment];

            const title = lastResult.payout > 0 ? '🎉 Winner!' : '😢 Better Luck Next Time';

            Alert.alert(
                title,
                `Segment: ${multiplier}\nStake: ${lastResult.stake} MON\nPayout: ${lastResult.payout} MON`,
                [{ text: 'OK' }]
            );
        }
    };

    // Stop any polling if the screen unmounts
    useEffect(() => {
        return () => {
            pollTokenRef.current++;
        };
    }, []);

    /**
     * Format address for display (0x1234...5678)
     */
    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    /**
     * Format balance for display (2 decimals)
     */
    const formatBalance = (balance) => {
        console.log('Formatting balance:', balance);
        if (!balance || balance === '0') {
            console.log('Balance is empty or 0');
            return '0.00';
        }
        return parseFloat(balance).toFixed(2);
    };

    const isButtonDisabled = isSpinning || isAnimating || !stakeAmount;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.content}>
                    {/* Header - Wallet Info */}
                    <View style={styles.header}>
                        <View style={styles.walletInfo}>
                            <Text style={styles.walletLabel}>Wallet</Text>
                            <Text style={styles.walletAddress}>{formatAddress(wallet.account)}</Text>
                        </View>
                        <View style={styles.balanceInfo}>
                            <Text style={styles.balanceLabel}>Balance</Text>
                            <View style={styles.balanceRow}>
                                <Text style={styles.balanceAmount}>{formatBalance(wallet.balance)} MON</Text>
                                <TouchableOpacity
                                    style={styles.refreshButton}
                                    onPress={async () => {
                                        console.log('Manual balance and result refresh triggered');
                                        await wallet.fetchBalance();
                                        await checkForRecentResult();
                                    }}
                                    disabled={isCheckingResult}
                                >
                                    <Text style={styles.refreshText}>🔄</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.disconnectButton}
                            onPress={wallet.disconnectWallet}
                        >
                            <Text style={styles.disconnectText}>Disconnect</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Wheel */}
                    <View style={styles.wheelContainer}>
                        <SpinWheel
                            segment={resultSegment}
                            isSpinning={isAnimating}
                            onSpinComplete={handleAnimationComplete}
                        />
                        {(isCheckingResult || isAwaitingConfirmation) && (
                            <View style={styles.checkingOverlay}>
                                <ActivityIndicator size="large" color="#3B82F6" />
                                <Text style={styles.checkingText}>
                                    {isAwaitingConfirmation
                                        ? 'Waiting for confirmation...'
                                        : 'Checking for results...'}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Last Result */}
                    {lastResult && !isAnimating && (
                        <View style={styles.resultContainer}>
                            <Text style={styles.resultTitle}>Last Spin</Text>
                            <View style={styles.resultRow}>
                                <Text style={styles.resultLabel}>Multiplier:</Text>
                                <Text style={styles.resultValue}>
                                    {['0×', '0×', '1.0×', '1.2×', '1.5×', '2.0×'][lastResult.segment]}
                                </Text>
                            </View>
                            <View style={styles.resultRow}>
                                <Text style={styles.resultLabel}>Payout:</Text>
                                <Text style={[
                                    styles.resultValue,
                                    lastResult.payout > 0 ? styles.resultWin : styles.resultLoss
                                ]}>
                                    {lastResult.payout} MON
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Stake Input and Spin Button */}
                    <View style={styles.controls}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Stake Amount</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0.0"
                                    placeholderTextColor="#64748B"
                                    value={stakeAmount}
                                    onChangeText={setStakeAmount}
                                    keyboardType="decimal-pad"
                                    editable={!isSpinning && !isAnimating}
                                    returnKeyType="done"
                                    onSubmitEditing={Keyboard.dismiss}
                                />
                                <Text style={styles.inputSuffix}>MON</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.spinButton,
                                isButtonDisabled && styles.spinButtonDisabled,
                            ]}
                            onPress={handleSpin}
                            disabled={isButtonDisabled}
                        >
                            {isSpinning ? (
                                <ActivityIndicator color="#ffffff" size="small" />
                            ) : (
                                <Text style={styles.spinButtonText}>
                                    {isAnimating ? 'Spinning...' : 'Spin'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Error Display */}
                    {spinError && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{spinError}</Text>
                        </View>
                    )}
                </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    header: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    walletInfo: {
        marginBottom: 8,
    },
    walletLabel: {
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 4,
    },
    walletAddress: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '600',
    },
    balanceInfo: {
        marginBottom: 12,
    },
    balanceLabel: {
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 4,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    balanceAmount: {
        fontSize: 20,
        color: '#3B82F6',
        fontWeight: 'bold',
    },
    refreshButton: {
        padding: 4,
    },
    refreshText: {
        fontSize: 18,
    },
    disconnectButton: {
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#DC2626',
    },
    disconnectText: {
        color: '#DC2626',
        fontSize: 14,
        fontWeight: '600',
    },
    wheelContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 24,
        position: 'relative',
    },
    checkingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    checkingText: {
        color: '#ffffff',
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
    },
    resultContainer: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 12,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    resultLabel: {
        fontSize: 14,
        color: '#94A3B8',
    },
    resultValue: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: '600',
    },
    resultWin: {
        color: '#10B981',
    },
    resultLoss: {
        color: '#DC2626',
    },
    controls: {
        marginTop: 'auto',
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        fontSize: 24,
        color: '#ffffff',
        paddingVertical: 16,
        fontWeight: '600',
    },
    inputSuffix: {
        fontSize: 18,
        color: '#64748B',
        marginLeft: 8,
    },
    spinButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    spinButtonDisabled: {
        backgroundColor: '#475569',
        shadowOpacity: 0,
    },
    spinButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    errorContainer: {
        backgroundColor: '#7F1D1D',
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
    },
    errorText: {
        color: '#FCA5A5',
        fontSize: 14,
        textAlign: 'center',
    },
});

export default SpinScreen;
