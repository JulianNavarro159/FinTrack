import Constants from 'expo-constants';
import { Platform } from 'react-native';

const FALLBACK_HOST_IP = '192.168.20.7';
const BACKEND_PORT = 3001;

const resolveDefaultBaseUrl = () => {
    const hostUri = Constants?.expoConfig?.hostUri
        || Constants?.manifest2?.extra?.expoClient?.hostUri
        || Constants?.manifest?.debuggerHost;

    if (typeof hostUri === 'string' && hostUri.length > 0) {
        const ip = hostUri.split(':')[0];
        if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
            return `http://${ip}:${BACKEND_PORT}`;
        }
    }

    if (Platform.OS === 'android') {
        return `http://${FALLBACK_HOST_IP}:${BACKEND_PORT}`;
    }

    return `http://${FALLBACK_HOST_IP}:${BACKEND_PORT}`;
};

const DEFAULT_API_URL = resolveDefaultBaseUrl();

let currentBaseUrl = DEFAULT_API_URL;
let currentToken = null;

export const mobileApi = {
    setBaseUrl(url) {
        if (url) currentBaseUrl = url.trim().replace(/\/$/, '');
    },

    getBaseUrl() {
        return currentBaseUrl;
    },

    setToken(token) {
        currentToken = token;
    },

    getToken() {
        return currentToken;
    },

    async pingServer() {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(`${currentBaseUrl}/categories`, {
                signal: controller.signal
            });
            clearTimeout(timer);
            return res.ok;
        } catch {
            return false;
        }
    },

    async request(endpoint, options = {}) {
        const url = `${currentBaseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }

        const config = {
            method: options.method || 'GET',
            headers
        };
        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        let response;
        try {
            response = await fetch(url, config);
        } catch (networkError) {
            throw new Error(`Unable to reach server at ${currentBaseUrl}. Check Wi-Fi connection and backend status.`);
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}`);
        }
        return data;
    },

    login(email, password = null) {
        return this.request('/users/login', {
            method: 'POST',
            body: { email, password }
        });
    },

    register(userData) {
        return this.request('/users/register', {
            method: 'POST',
            body: userData
        });
    },

    getProfile() {
        return this.request('/users/me');
    },

    updateProfile(data) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: data
        });
    },

    updateCurrency(currency) {
        return this.request('/users/currency', {
            method: 'PATCH',
            body: { currency }
        });
    },

    getCategories() {
        return this.request('/categories');
    },

    getMonthlySummary(month) {
        const query = month ? `?month=${month}` : '';
        return this.request(`/transaction/summary${query}`);
    },

    getTransactions(filters = {}) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, val]) => {
            if (val !== undefined && val !== null && val !== '') {
                params.append(key, val);
            }
        });
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.request(`/transaction${query}`);
    },

    createTransaction(data) {
        return this.request('/transaction', {
            method: 'POST',
            body: data
        });
    },

    deleteTransaction(id) {
        return this.request(`/transaction/${id}`, {
            method: 'DELETE'
        });
    }
};
