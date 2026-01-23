import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import Modal from 'react-native-modal';

/**
 * WalletConnect Modal
 * Shows connection instructions and deep link to MetaMask
 */
const WalletConnectModal = ({ visible, uri, onClose }) => {
    const handleOpenMetaMask = () => {
        if (uri) {
            // Deep link to MetaMask with WalletConnect URI
            const encodedUri = encodeURIComponent(uri);
            const metamaskDeepLink = `metamask://wc?uri=${encodedUri}`;

            Linking.openURL(metamaskDeepLink).catch(() => {
                // Fallback to App Store if MetaMask not installed
                Linking.openURL('https://metamask.app.link/wc?uri=' + encodedUri);
            });
        }
    };

    return (
        <Modal
            isVisible={visible}
            onBackdropPress={onClose}
            onBackButtonPress={onClose}
            style={styles.modal}
        >
            <View style={styles.container}>
                <Text style={styles.title}>Connect Your Wallet</Text>

                <Text style={styles.description}>
                    Connect your MetaMask wallet to play the Spin Wheel game
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleOpenMetaMask}
                >
                    <Text style={styles.buttonText}>Open MetaMask</Text>
                </TouchableOpacity>

                <Text style={styles.note}>
                    Make sure MetaMask is installed on your device
                </Text>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onClose}
                >
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modal: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 400,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    button: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    note: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 16,
    },
    cancelButton: {
        padding: 12,
        alignItems: 'center',
    },
    cancelText: {
        color: '#94A3B8',
        fontSize: 16,
    },
});

export default WalletConnectModal;
