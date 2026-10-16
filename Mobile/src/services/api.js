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
        localDb.loadLocalState().catch(() => {});
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
            return true;
        }
    },

    async login(email, password = null) {
        this.clearCache();
        const user = await localDb.loginLocalUser(email, password);
        return {
            token: `local_mobile_token_${user.id}_${Date.now()}`,
            user
        };
    },

    async register(userData) {
        this.clearCache();
        const user = await localDb.registerLocalUser(userData);
        return {
            token: `local_mobile_token_${user.id}_${Date.now()}`,
            user
        };
    },

    async getProfile() {
        return await localDb.getLocalUser();
    },

    async updateProfile(data) {
        const updatedUser = await localDb.updateLocalUser(data);
        return {
            message: 'Profile updated in device storage',
            user: updatedUser,
            token: currentToken || `local_mobile_token_${updatedUser.id}_${Date.now()}`
        };
    },

    async updateCurrency(currency) {
        summaryCache.clear();
        await localDb.updateLocalUser({ currency });
        return { message: 'Currency updated in device storage', currency };
    },

    async getCategories(forceRefresh = false) {
        if (!forceRefresh && cachedCategories && cachedCategories.length > 0) {
            return cachedCategories;
        }
        const localCats = await localDb.getLocalCategories();
        cachedCategories = localCats;
        return localCats;
    },

    async getMonthlySummary(month, forceRefresh = false) {
        const cacheKey = month || 'current';
        const now = Date.now();
        const cached = summaryCache.get(cacheKey);

        if (!forceRefresh && cached && (now - cached.timestamp < 45000)) {
            return cached.data;
        }

        const localSummary = await localDb.getLocalMonthlySummary(month);
        summaryCache.set(cacheKey, { timestamp: now, data: localSummary });
        return localSummary;
    },

    async getTransactions(filters = {}) {
        return await localDb.getLocalTransactions(filters);
    },

    async createTransaction(data) {
        summaryCache.clear();
        const localCreated = await localDb.createLocalTransaction(data);
        return {
            message: 'Transaction saved in device storage',
            transaction: localCreated
        };
    },

    async deleteTransaction(id) {
        summaryCache.clear();
        await localDb.deleteLocalTransaction(id);
        return { message: 'Transaction removed from device storage' };
    }
};
