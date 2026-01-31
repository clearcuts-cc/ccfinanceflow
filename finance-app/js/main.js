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

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        // Fallback to alert if container not found
        console.warn('Toast container not found, using alert');
        alert(message);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close">×</button>
    `;

    container.appendChild(toast);

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}
