import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    StatusBar,
    SafeAreaView,
} from 'react-native';
import WalletAddressModal from '../components/WalletAddressModal';

/**
 * WalletConnectScreen
 * 
 * First screen - shows when wallet is not connected
 * Displays logo, game title, and connect button
 */
const WalletConnectScreen = ({ onConnect, isConnecting, showAddressModal, onAddressSubmit, onAddressCancel }) => {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.content}>
                {/* Logo/Title Area */}
                <View style={styles.header}>
                    <Text style={styles.logo}>🎰</Text>
                    <Text style={styles.title}>Spin Wheel</Text>
                    <Text style={styles.subtitle}>Web3 Game on Monad</Text>
                </View>

                {/* Game Info */}
                <View style={styles.infoContainer}>
                    <Text style={styles.infoTitle}>How to Play</Text>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoBullet}>•</Text>
                        <Text style={styles.infoText}>Connect your wallet</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoBullet}>•</Text>
                        <Text style={styles.infoText}>Enter stake amount in MON</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoBullet}>•</Text>
                        <Text style={styles.infoText}>Tap Spin and confirm transaction</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoBullet}>•</Text>
                        <Text style={styles.infoText}>Win up to 2× your stake!</Text>
                    </View>

                    <View style={styles.multipliersContainer}>
                        <Text style={styles.multipliersTitle}>Multipliers:</Text>
                        <View style={styles.multipliers}>
                            <View style={[styles.multiplierBadge, { backgroundColor: '#10B981' }]}>
                                <Text style={styles.multiplierText}>1.0×</Text>
                            </View>
                            <View style={[styles.multiplierBadge, { backgroundColor: '#3B82F6' }]}>
                                <Text style={styles.multiplierText}>1.2×</Text>
                            </View>
                            <View style={[styles.multiplierBadge, { backgroundColor: '#8B5CF6' }]}>
                                <Text style={styles.multiplierText}>1.5×</Text>
                            </View>
                            <View style={[styles.multiplierBadge, { backgroundColor: '#F59E0B' }]}>
                                <Text style={styles.multiplierText}>2.0×</Text>
                            </View>
                            <View style={[styles.multiplierBadge, { backgroundColor: '#DC2626' }]}>
                                <Text style={styles.multiplierText}>0×</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Connect Button */}
                <TouchableOpacity
                    style={[styles.connectButton, isConnecting && styles.connectButtonDisabled]}
                    onPress={onConnect}
                    disabled={isConnecting}
                >
                    <Text style={styles.connectButtonText}>
                        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </Text>
                </TouchableOpacity>
            </View>

            <WalletAddressModal
                visible={showAddressModal}
                onSubmit={onAddressSubmit}
                onCancel={onAddressCancel}
            />
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
    },
    logo: {
        fontSize: 80,
        marginBottom: 16,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#94A3B8',
    },
    infoContainer: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 24,
        width: '100%',
    },
    infoTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 16,
    },
    infoItem: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    infoBullet: {
        fontSize: 16,
        color: '#3B82F6',
        marginRight: 8,
        fontWeight: 'bold',
    },
    infoText: {
        fontSize: 16,
        color: '#CBD5E1',
        flex: 1,
    },
    multipliersContainer: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    multipliersTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 12,
    },
    multipliers: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    multiplierBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    multiplierText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    connectButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    connectButtonDisabled: {
        backgroundColor: '#475569',
        shadowOpacity: 0,
    },
    connectButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default WalletConnectScreen;
