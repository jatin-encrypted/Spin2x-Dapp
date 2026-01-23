import React from 'react';
import { LogBox } from 'react-native';
import 'react-native-get-random-values';
import WalletConnectScreen from './src/screens/WalletConnectScreen';
import SpinScreen from './src/screens/SpinScreen';
import { WalletProvider, useWallet } from './src/hooks/useWallet';

// Ignore specific warnings (optional)
LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
]);

/**
 * Main App Component
 * 
 * Handles:
 * - Wallet provider setup
 * - Screen routing based on wallet connection state
 */
export default function App() {
    return (
        <WalletProvider>
            <AppContent />
        </WalletProvider>
    );
}

function AppContent() {
    const wallet = useWallet();

    // Show connect screen if wallet not connected
    if (!wallet.isConnected) {
        return (
            <WalletConnectScreen
                onConnect={wallet.connectWallet}
                isConnecting={wallet.isConnecting}
                showAddressModal={wallet.showAddressModal}
                onAddressSubmit={wallet.handleAddressSubmit}
                onAddressCancel={wallet.handleAddressCancel}
            />
        );
    }

    // Show spin screen when connected
    return <SpinScreen wallet={wallet} />;
}
