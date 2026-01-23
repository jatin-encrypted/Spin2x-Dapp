/**
 * Utility functions for error handling and formatting
 */

/**
 * Parse error messages from blockchain transactions
 * @param {Error} error - Error object from transaction
 * @returns {string} User-friendly error message
 */
export const parseTransactionError = (error) => {
    const message = error.message || error.toString();

    // User rejected transaction
    if (message.includes('user rejected') || message.includes('User rejected')) {
        return 'Transaction was rejected';
    }

    // Insufficient balance
    if (message.includes('insufficient funds') || message.includes('insufficient balance')) {
        return 'Insufficient balance to complete transaction';
    }

    // Contract revert errors
    if (message.includes('Stake must be greater than 0')) {
        return 'Stake amount must be greater than 0';
    }

    if (message.includes('Contract has insufficient funds')) {
        return 'Game contract has insufficient funds. Please try again later.';
    }

    if (message.includes('execution reverted')) {
        return 'Transaction failed. Please check your balance and try again.';
    }

    // Network errors
    if (message.includes('network') || message.includes('timeout')) {
        return 'Network error. Please check your connection and try again.';
    }

    // Gas errors
    if (message.includes('gas')) {
        return 'Transaction failed due to gas issues. Please try again.';
    }

    // Default error
    return 'Transaction failed. Please try again.';
};

/**
 * Format wallet address for display
 * @param {string} address - Full wallet address
 * @param {number} chars - Number of characters to show on each end
 * @returns {string} Formatted address (e.g., 0x1234...5678)
 */
export const formatAddress = (address, chars = 4) => {
    if (!address) return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

/**
 * Format number with decimals
 * @param {string|number} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
export const formatNumber = (value, decimals = 2) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(decimals);
};

/**
 * Validate stake amount
 * @param {string} stake - Stake amount entered by user
 * @param {string} balance - User's balance
 * @returns {Object} Validation result with isValid and error message
 */
export const validateStakeAmount = (stake, balance) => {
    // Check if stake is a valid number
    const stakeNum = parseFloat(stake);
    if (isNaN(stakeNum) || stakeNum <= 0) {
        return {
            isValid: false,
            error: 'Please enter a valid amount greater than 0',
        };
    }

    // Check if user has sufficient balance
    const balanceNum = parseFloat(balance);
    if (stakeNum > balanceNum) {
        return {
            isValid: false,
            error: 'Insufficient balance',
        };
    }

    // Set reasonable limits
    const MIN_STAKE = 0.001; // Minimum 0.001 MON
    const MAX_STAKE = 100; // Maximum 100 MON per spin

    if (stakeNum < MIN_STAKE) {
        return {
            isValid: false,
            error: `Minimum stake is ${MIN_STAKE} MON`,
        };
    }

    if (stakeNum > MAX_STAKE) {
        return {
            isValid: false,
            error: `Maximum stake is ${MAX_STAKE} MON`,
        };
    }

    return {
        isValid: true,
        error: null,
    };
};

/**
 * Get multiplier label from segment index
 * @param {number} segment - Segment index (0-5)
 * @returns {string} Multiplier label (e.g., "2.0×")
 */
export const getMultiplierLabel = (segment) => {
    const multipliers = ['0×', '0×', '1.0×', '1.2×', '1.5×', '2.0×'];
    return multipliers[segment] || '0×';
};

/**
 * Calculate potential payout
 * @param {string} stake - Stake amount
 * @param {number} segment - Segment index (0-5)
 * @returns {string} Potential payout amount
 */
export const calculatePayout = (stake, segment) => {
    const multipliers = [0, 0, 1.0, 1.2, 1.5, 2.0];
    const stakeNum = parseFloat(stake);
    const payout = stakeNum * multipliers[segment];
    return payout.toFixed(4);
};

/**
 * Delay utility for testing/demo
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
export const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
