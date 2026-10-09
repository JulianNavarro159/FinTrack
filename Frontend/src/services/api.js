const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const getStoredToken = () => {
    return localStorage.getItem('fintrack_token') || '';
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
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(userData)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Registration failed');
        }
        return await response.json();
    },

    async login(email, password = null) {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Login failed');
        }
        return await response.json();
    },

    async getProfile() {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: getHeaders(false)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to fetch user profile');
        }
        return await response.json();
    },

    async updateProfile(profileData) {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers: getHeaders(true),
            body: JSON.stringify(profileData)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to update user profile');
        }
        return await response.json();
    },

    async updateCurrency(currency) {
        const response = await fetch(`${API_BASE_URL}/users/currency`, {
            method: 'PATCH',
            headers: getHeaders(true),
            body: JSON.stringify({ currency })
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to update currency');
        }
        return await response.json();
    },

    async getCategories() {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            headers: getHeaders(false)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to fetch categories');
        }
        return await response.json();
    },

    async getPaymentMethods() {
        const response = await fetch(`${API_BASE_URL}/categories/payment-methods`, {
            headers: getHeaders(false)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to fetch payment methods');
        }
        return await response.json();
    },

    async getMonthlySummary(month) {
        const query = month ? `?month=${month}` : '';
        const response = await fetch(`${API_BASE_URL}/transaction/summary${query}`, {
            headers: getHeaders(false)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to fetch monthly summary');
        }
        return await response.json();
    },

    async getTransactions(params = {}) {
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
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to fetch transactions');
        }
        return await response.json();
    },

    async createTransaction(transactionData) {
        const response = await fetch(`${API_BASE_URL}/transaction`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(transactionData)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to create transaction');
        }
        return await response.json();
    },

    async updateTransaction(id, transactionData) {
        const response = await fetch(`${API_BASE_URL}/transaction/${id}`, {
            method: 'PUT',
            headers: getHeaders(true),
            body: JSON.stringify(transactionData)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to update transaction');
        }
        return await response.json();
    },

    async deleteTransaction(id) {
        const response = await fetch(`${API_BASE_URL}/transaction/${id}`, {
            method: 'DELETE',
            headers: getHeaders(false)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to delete transaction');
        }
        return await response.json();
    }
};
