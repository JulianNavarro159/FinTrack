import Constants from 'expo-constants';
import * as localDb from './localMobileDb';

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
            // Non-blocking prewarm
        }
    },

    async pingServer() {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(`${currentBaseUrl}/ping`, {
                signal: controller.signal
            });
            clearTimeout(timer);
            return res.ok;
        } catch {
            try {
                const fallbackController = new AbortController();
                const fallbackTimer = setTimeout(() => fallbackController.abort(), 5000);
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
        const timeoutMs = options.timeoutMs || 6000;
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
            const err = new Error(`No se pudo conectar al servidor en ${currentBaseUrl}.`);
            err.isNetworkError = true;
            throw err;
        } finally {
            clearTimeout(timeoutTimer);
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const err = new Error(data.message || `HTTP ${response.status}`);
            err.status = response.status;
            throw err;
        }
        return data;
    },

    async login(email, password = null) {
        this.clearCache();
        try {
            const data = await this.request('/users/login', {
                method: 'POST',
                body: { email, password }
            });
            if (data?.user) {
                await localDb.updateLocalUser(data.user);
            }
            return data;
        } catch (err) {
            if (!err.isNetworkError && err.status && err.status < 500) {
                throw err;
            }
            const user = await localDb.updateLocalUser({ email });
            return {
                token: `local_mobile_token_${Date.now()}`,
                user
            };
        }
    },

    async register(userData) {
        this.clearCache();
        try {
            const data = await this.request('/users/register', {
                method: 'POST',
                body: userData
            });
            if (data?.user) {
                await localDb.updateLocalUser(data.user);
            }
            return data;
        } catch (err) {
            if (!err.isNetworkError && err.status && err.status < 500) {
                throw err;
            }
            const user = await localDb.updateLocalUser({
                name: userData.name,
                email: userData.email,
                currency: userData.currency || 'COP'
            });
            return {
                token: `local_mobile_token_${Date.now()}`,
                user
            };
        }
    },

    async getProfile() {
        try {
            const profile = await this.request('/users/me');
            await localDb.updateLocalUser(profile);
            return profile;
        } catch {
            return await localDb.getLocalUser();
        }
    },

    async updateProfile(data) {
        const localUser = await localDb.updateLocalUser(data);
        try {
            return await this.request('/users/profile', {
                method: 'PUT',
                body: data
            });
        } catch (err) {
            if (!err.isNetworkError && err.status && err.status < 500) {
                throw err;
            }
            return {
                message: 'Profile updated in device storage',
                user: localUser,
                token: currentToken || `local_mobile_token_${Date.now()}`
            };
        }
    },

    async updateCurrency(currency) {
        summaryCache.clear();
        await localDb.updateLocalUser({ currency });
        try {
            return await this.request('/users/currency', {
                method: 'PATCH',
                body: { currency }
            });
        } catch {
            return { message: 'Currency updated in device storage', currency };
        }
    },

    async getCategories(forceRefresh = false) {
        if (!forceRefresh && cachedCategories && cachedCategories.length > 0) {
            return cachedCategories;
        }
        try {
            const data = await this.request('/categories');
            cachedCategories = data;
            return data;
        } catch {
            const localCats = await localDb.getLocalCategories();
            cachedCategories = localCats;
            return localCats;
        }
    },

    async getMonthlySummary(month, forceRefresh = false) {
        const cacheKey = month || 'current';
        const now = Date.now();
        const cached = summaryCache.get(cacheKey);

        if (!forceRefresh && cached && (now - cached.timestamp < 45000)) {
            return cached.data;
        }

        try {
            const query = month ? `?month=${month}` : '';
            const data = await this.request(`/transaction/summary${query}`);
            summaryCache.set(cacheKey, { timestamp: now, data });
            return data;
        } catch {
            const localSummary = await localDb.getLocalMonthlySummary(month);
            summaryCache.set(cacheKey, { timestamp: now, data: localSummary });
            return localSummary;
        }
    },

    async getTransactions(filters = {}) {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, val]) => {
                if (val !== undefined && val !== null && val !== '') {
                    params.append(key, val);
                }
            });
            const query = params.toString() ? `?${params.toString()}` : '';
            return await this.request(`/transaction${query}`);
        } catch {
            return await localDb.getLocalTransactions(filters);
        }
    },

    async createTransaction(data) {
        summaryCache.clear();
        const localCreated = await localDb.createLocalTransaction(data);
        try {
            return await this.request('/transaction', {
                method: 'POST',
                body: data
            });
        } catch {
            return {
                message: 'Transaction saved in device storage',
                transaction: localCreated
            };
        }
    },

    async deleteTransaction(id) {
        summaryCache.clear();
        await localDb.deleteLocalTransaction(id);
        try {
            return await this.request(`/transaction/${id}`, {
                method: 'DELETE'
            });
        } catch {
            return { message: 'Transaction removed from device storage' };
        }
    }
};
