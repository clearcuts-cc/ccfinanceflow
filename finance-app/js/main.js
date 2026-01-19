/**
 * FinanceFlow - Main Utilities
 * Shared utility functions used across the application
 */

/**
 * Format currency amount
 * @param {number|string} amount 
 * @param {string} symbol 
 * @returns {string} Formatted string
 */
function formatCurrency(amount, symbol = '₹') {
    const validAmount = parseFloat(amount) || 0;
    return `${symbol}${validAmount.toFixed(2)}`;
}

/**
 * Format date string
 * @param {string} dateString 
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    try {
        return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
        return dateString;
    }
}

/**
 * Format payment mode string (e.g. 'bank_transfer' -> 'Bank Transfer')
 * @param {string} mode 
 * @returns {string} Formatted mode
 */
function formatPaymentMode(mode) {
    if (!mode) return '-';
    return mode
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Format status string
 * @param {string} status 
 * @returns {string} Formatted status
 */
function formatStatus(status) {
    if (!status) return '-';
    return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Debounce function for search inputs
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
