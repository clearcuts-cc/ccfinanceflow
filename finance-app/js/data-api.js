/**
 * FinanceFlow - API Data Layer
 * Handles all data operations via REST API
 * Drop-in replacement for the IndexedDB-based data.js
 */

const API_BASE = `${CONFIG.API_BASE_URL}/api`;

class DataLayerAPI {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Initialize the data layer (no-op for API, kept for compatibility)
     */
    async init() {
        console.log('DataLayerAPI initialized');
        return Promise.resolve();
    }

    /**
     * Make an API request
     */
    /**
     * Make an API request
     */
    async _request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;

        // Get JWT token
        const token = localStorage.getItem('token');

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers
            }
        };

        // Only stringify if body is an object and not already a string
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            console.log(`API Request: ${config.method || 'GET'} ${url}`);
            const response = await fetch(url, config);

            // Handle Unauthorized Access (401)
            if (response.status === 401 || response.status === 403) {
                // If not already on auth pages, redirect to login
                const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html');
                if (!isAuthPage) {
                    console.warn('Unauthorized access, redirecting to login');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                    return null;
                }
            }

            const data = await response.json();

            if (!response.ok) {
                console.error('API Error Response:', data);
                throw new Error(data.error?.message || 'API request failed');
            }

            return data.data || data; // Handle responses wrapped in 'data' or direct (like Auth)
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Add a change listener
     */
    subscribe(storeName, callback) {
        if (!this.listeners.has(storeName)) {
            this.listeners.set(storeName, new Set());
        }
        this.listeners.get(storeName).add(callback);

        return () => {
            this.listeners.get(storeName).delete(callback);
        };
    }

    /**
     * Notify listeners of changes
     */
    notifyListeners(storeName) {
        if (this.listeners.has(storeName)) {
            this.listeners.get(storeName).forEach(callback => callback());
        }
    }

    // ==================== Finance Entries ====================

    async addEntry(entry) {
        const result = await this._request('/entries', {
            method: 'POST',
            body: entry
        });
        this.notifyListeners(DATA_STORES.ENTRIES);
        return result;
    }

    async updateEntry(id, entry) {
        const result = await this._request(`/entries/${id}`, {
            method: 'PUT',
            body: entry
        });
        this.notifyListeners(DATA_STORES.ENTRIES);
        return result;
    }

    async deleteEntry(id) {
        await this._request(`/entries/${id}`, { method: 'DELETE' });
        this.notifyListeners(DATA_STORES.ENTRIES);
        return true;
    }

    async getEntry(id) {
        return this._request(`/entries/${id}`);
    }

    async getAllEntries() {
        return this._request('/entries');
    }

    async getFilteredEntries(filters = {}) {
        const params = new URLSearchParams();

        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.month !== '' && filters.month !== undefined) params.append('month', filters.month);
        if (filters.year) params.append('year', filters.year);
        if (filters.type) params.append('type', filters.type);
        if (filters.status) params.append('status', filters.status);
        if (filters.paymentMode) params.append('paymentMode', filters.paymentMode);
        if (filters.search) params.append('search', filters.search);

        const queryString = params.toString();
        return this._request(`/entries${queryString ? `?${queryString}` : ''}`);
    }

    async getFinancialSummary(filters = {}) {
        const params = new URLSearchParams();

        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.month !== '' && filters.month !== undefined) params.append('month', filters.month);
        if (filters.year) params.append('year', filters.year);
        if (filters.type) params.append('type', filters.type);
        if (filters.status) params.append('status', filters.status);
        if (filters.paymentMode) params.append('paymentMode', filters.paymentMode);

        const queryString = params.toString();
        return this._request(`/analytics/financial-summary${queryString ? `?${queryString}` : ''}`);
    }

    async getMonthlyData(year) {
        return this._request(`/analytics/monthly/${year}`);
    }

    async getPaymentModeDistribution() {
        return this._request('/analytics/payment-modes');
    }

    async getStatusDistribution() {
        return this._request('/analytics/status-distribution');
    }

    async getYearlyRevenue() {
        return this._request('/analytics/yearly-revenue');
    }

    // ==================== Invoices ====================

    async addInvoice(invoice) {
        const result = await this._request('/invoices', {
            method: 'POST',
            body: invoice
        });
        this.notifyListeners(DATA_STORES.INVOICES);
        return result;
    }

    async updateInvoice(id, invoice) {
        const result = await this._request(`/invoices/${id}`, {
            method: 'PUT',
            body: invoice
        });
        this.notifyListeners(DATA_STORES.INVOICES);
        return result;
    }

    async deleteInvoice(id) {
        await this._request(`/invoices/${id}`, { method: 'DELETE' });
        this.notifyListeners(DATA_STORES.INVOICES);
        return true;
    }

    async importInvoices(invoices) {
        const result = await this._request('/invoices/import', {
            method: 'POST',
            body: { invoices }
        });
        this.notifyListeners(DATA_STORES.INVOICES); // Assuming import also triggers a notification
        return result;
    }

    async getInvoice(id) {
        return this._request(`/invoices/${id}`);
    }

    async getAllInvoices() {
        return this._request('/invoices');
    }

    async getNextInvoiceNumber() {
        const result = await this._request('/invoices/next-number');
        return result.invoiceNumber;
    }

    // ==================== Clients ====================

    async addClient(client) {
        const result = await this._request('/clients', {
            method: 'POST',
            body: client
        });
        this.notifyListeners(DATA_STORES.CLIENTS);
        return result;
    }

    async updateClient(id, client) {
        const result = await this._request(`/clients/${id}`, {
            method: 'PUT',
            body: client
        });
        this.notifyListeners(DATA_STORES.CLIENTS);
        return result;
    }

    async deleteClient(id) {
        await this._request(`/clients/${id}`, { method: 'DELETE' });
        this.notifyListeners(DATA_STORES.CLIENTS);
        return true;
    }

    async getClient(id) {
        return this._request(`/clients/${id}`);
    }

    async getAllClients() {
        return this._request('/clients');
    }

    async getClientByName(name) {
        const clients = await this.getAllClients();
        return clients.find(c => c.name.toLowerCase() === name.toLowerCase());
    }

    // ==================== Settings ====================

    async getSetting(key) {
        const result = await this._request(`/settings/${key}`);
        return result?.value ?? null;
    }

    async setSetting(key, value) {
        await this._request(`/settings/${key}`, {
            method: 'PUT',
            body: { value }
        });
        return true;
    }

    async getAllSettings() {
        return this._request('/settings');
    }

    // ==================== Export/Import ====================

    async exportData() {
        return this._request('/export');
    }

    async importData(data) {
        await this._request('/import', {
            method: 'POST',
            body: data
        });

        // Notify all listeners
        this.notifyListeners(DATA_STORES.ENTRIES);
        this.notifyListeners(DATA_STORES.INVOICES);
        this.notifyListeners(DATA_STORES.CLIENTS);

        return true;
    }

    async clearAll() {
        await this._request('/clear', { method: 'DELETE' });

        // Notify all listeners
        this.notifyListeners(DATA_STORES.ENTRIES);
        this.notifyListeners(DATA_STORES.INVOICES);
        this.notifyListeners(DATA_STORES.CLIENTS);

        return true;
    }

    async clearStore(storeName) {
        // For API-based layer, we just clear all
        // Individual store clearing could be implemented if needed
        console.warn('clearStore: Clearing all data via API');
        return this.clearAll();
    }
}

// Store names (kept for compatibility)
const DATA_STORES = {
    ENTRIES: 'finance_entries',
    INVOICES: 'invoices',
    CLIENTS: 'clients',
    SETTINGS: 'settings'
};

// Create and export singleton instance
const dataLayer = new DataLayerAPI();

// Helper functions for formatting (kept from original)
const formatCurrency = (amount, currency = '₹') => {
    const num = parseFloat(amount) || 0;
    return `${currency}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const formatPaymentMode = (mode) => {
    const modes = {
        cash: 'Cash',
        upi: 'UPI',
        bank_transfer: 'Bank Transfer',
        card: 'Card',
        cheque: 'Cheque'
    };
    return modes[mode] || mode;
};
