import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PRODUCTION_API_URL = 'https://fintrack-backend-pza5.onrender.com';
const FALLBACK_HOST_IP = '192.168.20.7';
const BACKEND_PORT = 3001;

const resolveDefaultBaseUrl = () => {
    if (PRODUCTION_API_URL) {
        return PRODUCTION_API_URL;
    }

    const hostUri = Constants?.expoConfig?.hostUri
        || Constants?.manifest2?.extra?.expoClient?.hostUri
        || Constants?.manifest?.debuggerHost;

    if (typeof hostUri === 'string' && hostUri.length > 0) {
        const ip = hostUri.split(':')[0];
        if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
            return `http://${ip}:${BACKEND_PORT}`;
        }
    }

    return `http://${FALLBACK_HOST_IP}:${BACKEND_PORT}`;
};

const DEFAULT_API_URL = resolveDefaultBaseUrl();

let currentBaseUrl = DEFAULT_API_URL;
let currentToken = null;
let cachedCategories = null;
const summaryCache = new Map();

export const mobileApi = {
    setBaseUrl(url) {
        if (url) currentBaseUrl = url.trim().replace(/\/$/, '');
        summaryCache.clear();
        cachedCategories = null;
    },

    getBaseUrl() {
        return currentBaseUrl;
    },

    setToken(token) {
        currentToken = token;
        if (!token) {
            summaryCache.clear();
            cachedCategories = null;
        }
    },

    getToken() {
        return currentToken;
    },

    clearCache() {
        summaryCache.clear();
        cachedCategories = null;
    },

    wakeUpServer() {
        try {
            fetch(`${currentBaseUrl}/ping`, { method: 'GET' }).catch(() => {});
        } catch {
            // ignore non-blocking error
        }
    },

    async pingServer() {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(`${currentBaseUrl}/ping`, {
                signal: controller.signal
            });
            clearTimeout(timer);
            return res.ok;
        } catch {
            try {
                const fallbackController = new AbortController();
                const fallbackTimer = setTimeout(() => fallbackController.abort(), 6000);
                const res = await fetch(`${currentBaseUrl}/categories`, {
                    signal: fallbackController.signal
                });
                clearTimeout(fallbackTimer);
                return res.ok;
            } catch {
                return false;
            }
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

        const controller = new AbortController();
        const timeoutMs = options.timeoutMs || 45000;
        const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

        const config = {
            method: options.method || 'GET',
            headers,
            signal: controller.signal
        };
        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        let response;
        try {
            response = await fetch(url, config);
        } catch (networkError) {
            if (networkError.name === 'AbortError') {
                throw new Error('Tiempo de espera agotado. Verifica tu conexion a internet.');
            }
            throw new Error(`No se pudo conectar al servidor en ${currentBaseUrl}.`);
        } finally {
            clearTimeout(timeoutTimer);
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}`);
        }
        return data;
    },

    login(email, password = null) {
        this.clearCache();
        return this.request('/users/login', {
            method: 'POST',
            body: { email, password }
        });
    },

    register(userData) {
        this.clearCache();
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
        summaryCache.clear();
        return this.request('/users/currency', {
            method: 'PATCH',
            body: { currency }
        });
    },

    async getCategories(forceRefresh = false) {
        if (!forceRefresh && cachedCategories && cachedCategories.length > 0) {
            return cachedCategories;
        }
        const data = await this.request('/categories');
        cachedCategories = data;
        return data;
    },

    async getMonthlySummary(month, forceRefresh = false) {
        const cacheKey = month || 'current';
        const now = Date.now();
        const cached = summaryCache.get(cacheKey);

        if (!forceRefresh && cached && (now - cached.timestamp < 45000)) {
            return cached.data;
        }

        const query = month ? `?month=${month}` : '';
        const data = await this.request(`/transaction/summary${query}`);
        summaryCache.set(cacheKey, { timestamp: now, data });
        return data;
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

    async createTransaction(data) {
        summaryCache.clear();
        return await this.request('/transaction', {
            method: 'POST',
            body: data
        });
    },

    async deleteTransaction(id) {
        summaryCache.clear();
        return await this.request(`/transaction/${id}`, {
            method: 'DELETE'
        });
    }
};
