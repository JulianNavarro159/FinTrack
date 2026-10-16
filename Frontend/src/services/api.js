import * as localDb from './localStorageDb';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const getStoredToken = () => {
    return localStorage.getItem('fintrack_token') || 'local_session_token';
};

const getHeaders = (hasBody = true) => {
    const headers = {};
    if (hasBody) {
        headers['Content-Type'] = 'application/json';
    }
    const token = getStoredToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const api = {
    setToken(token) {
        if (token) {
            localStorage.setItem('fintrack_token', token);
        } else {
            localStorage.removeItem('fintrack_token');
        }
    },

    getToken() {
        return getStoredToken();
    },

    async registerUser(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/register`, {
                method: 'POST',
                headers: getHeaders(true),
                body: JSON.stringify(userData)
            });
            if (response.ok) {
                const data = await response.json();
                localDb.updateLocalUser(data.user);
                return data;
            }
        } catch (err) {
            console.warn('[API] Using local device registration fallback:', err.message);
        }
        const user = localDb.updateLocalUser({
            name: userData.name,
            email: userData.email,
            currency: userData.currency || 'USD'
        });
        return {
            token: 'local_token_' + Date.now(),
            user
        };
    },

    async login(email, password = null) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: getHeaders(true),
                body: JSON.stringify({ email, password })
            });
            if (response.ok) {
                const data = await response.json();
                localDb.updateLocalUser(data.user);
                return data;
            }
        } catch (err) {
            console.warn('[API] Using local device login fallback:', err.message);
        }
        const user = localDb.getLocalUser();
        return {
            token: 'local_token_' + Date.now(),
            user
        };
    },

    async getProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                headers: getHeaders(false)
            });
            if (response.ok) {
                const user = await response.json();
                localDb.updateLocalUser(user);
                return user;
            }
        } catch (err) {
            console.warn('[API] Serving profile from local device storage:', err.message);
        }
        return localDb.getLocalUser();
    },

    async updateProfile(profileData) {
        localDb.updateLocalUser(profileData);
        try {
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PUT',
                headers: getHeaders(true),
                body: JSON.stringify(profileData)
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (err) {
            console.warn('[API] Updated profile in local storage (server offline):', err.message);
        }
        return {
            message: 'Profile updated locally',
            user: localDb.getLocalUser()
        };
    },

    async updateCurrency(currency) {
        localDb.updateLocalUser({ currency });
        try {
            const response = await fetch(`${API_BASE_URL}/users/currency`, {
                method: 'PATCH',
                headers: getHeaders(true),
                body: JSON.stringify({ currency })
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (err) {
            console.warn('[API] Currency updated in local storage:', err.message);
        }
        return { message: 'Currency updated locally', currency };
    },

    async getCategories() {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`, {
                headers: getHeaders(false)
            });
            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (err) {
            console.warn('[API] Using local device categories fallback:', err.message);
        }
        return localDb.getLocalCategories();
    },

    async getPaymentMethods() {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/payment-methods`, {
                headers: getHeaders(false)
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (err) {
            console.warn('[API] Using local payment methods fallback:', err.message);
        }
        return localDb.getLocalPaymentMethods();
    },

    async getMonthlySummary(month) {
        try {
            const query = month ? `?month=${month}` : '';
            const response = await fetch(`${API_BASE_URL}/transaction/summary${query}`, {
                headers: getHeaders(false)
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (err) {
            console.warn('[API] Calculating monthly summary from local device storage:', err.message);
        }
        return localDb.getLocalMonthlySummary(month);
    },

    async getTransactions(params = {}) {
        try {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, val]) => {
                if (val !== undefined && val !== null && val !== '') {
                    searchParams.append(key, val);
                }
            });
            const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
            const response = await fetch(`${API_BASE_URL}/transaction${query}`, {
                headers: getHeaders(false)
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (err) {
            console.warn('[API] Loading transactions from local device storage:', err.message);
        }
        return localDb.getLocalTransactions(params);
    },

    async createTransaction(transactionData) {
        const localCreated = localDb.createLocalTransaction(transactionData);
        try {
            const response = await fetch(`${API_BASE_URL}/transaction`, {
                method: 'POST',
                headers: getHeaders(true),
                body: JSON.stringify(transactionData)
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (err) {
            console.warn('[API] Saved transaction to local storage (server offline):', err.message);
        }
        return {
            message: 'Transaction saved to phone storage',
            transaction: localCreated
        };
    },

    async updateTransaction(id, transactionData) {
        const localUpdated = localDb.updateLocalTransaction(id, transactionData);
        try {
            const response = await fetch(`${API_BASE_URL}/transaction/${id}`, {
                method: 'PUT',
                headers: getHeaders(true),
                body: JSON.stringify(transactionData)
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (err) {
            console.warn('[API] Updated transaction in local storage:', err.message);
        }
        return {
            message: 'Transaction updated in phone storage',
            transaction: localUpdated
        };
    },

    async deleteTransaction(id) {
        localDb.deleteLocalTransaction(id);
        try {
            const response = await fetch(`${API_BASE_URL}/transaction/${id}`, {
                method: 'DELETE',
                headers: getHeaders(false)
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (err) {
            console.warn('[API] Deleted transaction from local storage:', err.message);
        }
        return { message: 'Transaction deleted from phone storage' };
    },

    // Cloud / File backup & restore helpers
    exportBackup() {
        return localDb.exportLocalDataJson();
    },

    importBackup(jsonString) {
        return localDb.importLocalDataJson(jsonString);
    }
};
