import * as SecureStore from 'expo-secure-store';

const STORAGE_BASE_KEY = 'fintrack_mobile_db_v1';
const CHUNK_SIZE = 1800;

const DEFAULT_INCOME_CATEGORIES = ['salario', 'inversiones', 'otros'];
const DEFAULT_EXPENSE_CATEGORIES = [
    'compras',
    'alimentos',
    'telefonica',
    'entretenimiento',
    'educacion',
    'salud',
    'deportes',
    'transporte',
    'ropa',
    'viajes',
    'hijos',
    'verduras',
    'frutas',
    'auto',
    'hogar',
    'mascota',
    'reparaciones',
    'otros'
];

let memoryState = null;

/**
 * Removes sensitive internal attributes before returning a user object.
 *
 * @param {object} user - Raw user record.
 * @returns {object} Public user record.
 */
function sanitizeUser(user) {
    if (!user) return null;
    return {
        id: user.id || 1,
        name: user.name || 'Usuario FinTrack',
        lastName: user.lastName || '',
        email: user.email || '',
        currency: user.currency || 'COP',
        profilephoto: user.profilephoto || ''
    };
}

/**
 * Generates initial local database state with default categories.
 *
 * @returns {object} Initial state object.
 */
function createInitialState() {
    let catId = 1;
    const categories = [
        ...DEFAULT_INCOME_CATEGORIES.map((name) => ({
            id: catId++,
            name,
            type: 'income',
            idUser: null
        })),
        ...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
            id: catId++,
            name,
            type: 'expense',
            idUser: null
        }))
    ];

    return {
        user: {
            id: 1,
            name: 'Usuario FinTrack',
            lastName: '',
            email: 'usuario@fintrack.com',
            password: null,
            currency: 'COP',
            profilephoto: ''
        },
        users: [],
        categories,
        transactions: []
    };
}

/**
 * Persists state across chunked SecureStore entries.
 *
 * @param {object} state - State object to persist.
 * @returns {Promise<void>}
 */
async function persistState(state) {
    memoryState = state;
    try {
        const serialized = JSON.stringify(state);
        const totalChunks = Math.ceil(serialized.length / CHUNK_SIZE);
        await SecureStore.setItemAsync(`${STORAGE_BASE_KEY}_count`, String(totalChunks));
        for (let i = 0; i < totalChunks; i++) {
            const slice = serialized.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            await SecureStore.setItemAsync(`${STORAGE_BASE_KEY}_chunk_${i}`, slice);
        }
    } catch (err) {
        console.warn('Local storage persistence warning:', err.message);
    }
}

/**
 * Loads state from memory or chunked SecureStore entries.
 *
 * @returns {Promise<object>} Loaded state object.
 */
export async function loadLocalState() {
    if (memoryState) {
        return memoryState;
    }
    try {
        const countStr = await SecureStore.getItemAsync(`${STORAGE_BASE_KEY}_count`);
        const totalChunks = parseInt(countStr, 10);
        if (!totalChunks || totalChunks <= 0) {
            const initial = createInitialState();
            await persistState(initial);
            return initial;
        }

        const parts = [];
        for (let i = 0; i < totalChunks; i++) {
            const chunk = await SecureStore.getItemAsync(`${STORAGE_BASE_KEY}_chunk_${i}`);
            if (chunk !== null) {
                parts.push(chunk);
            }
        }

        const parsed = JSON.parse(parts.join(''));
        if (!parsed || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.categories)) {
            const initial = createInitialState();
            await persistState(initial);
            return initial;
        }

        if (!Array.isArray(parsed.users)) {
            parsed.users = [];
            if (parsed.user && parsed.user.email && parsed.user.email !== 'usuario@fintrack.com') {
                parsed.users.push({ ...parsed.user });
            }
        }

        memoryState = parsed;
        return memoryState;
    } catch {
        const initial = createInitialState();
        memoryState = initial;
        return initial;
    }
}

/**
 * Registers or updates a user in local phone storage.
 *
 * @param {object} userData - Registration payload.
 * @returns {Promise<object>} Sanitized user object.
 */
export async function registerLocalUser(userData) {
    const state = await loadLocalState();
    const normEmail = (userData.email || '').trim().toLowerCase();
    const cleanPassword = userData.password ? userData.password.trim() : null;

    let existingIdx = state.users.findIndex(
        (u) => (u.email || '').trim().toLowerCase() === normEmail
    );

    if (existingIdx !== -1) {
        const existingUser = state.users[existingIdx];
        if (existingUser.password && cleanPassword && existingUser.password !== cleanPassword) {
            const err = new Error('Ya existe una cuenta con este correo y una contrasena distinta.');
            err.status = 409;
            throw err;
        }
        const updatedUser = {
            ...existingUser,
            name: userData.name ? userData.name.trim() : existingUser.name,
            currency: userData.currency || existingUser.currency || 'COP',
            password: cleanPassword || existingUser.password
        };
        state.users[existingIdx] = updatedUser;
        state.user = updatedUser;
        await persistState(state);
        return sanitizeUser(updatedUser);
    }

    if (
        state.user &&
        (state.user.email === 'usuario@fintrack.com' ||
            (state.user.email || '').trim().toLowerCase() === normEmail)
    ) {
        const upgradedUser = {
            ...state.user,
            id: state.user.id || 1,
            name: userData.name ? userData.name.trim() : state.user.name,
            lastName: userData.lastName ? userData.lastName.trim() : (state.user.lastName || ''),
            email: normEmail,
            password: cleanPassword || state.user.password || null,
            currency: userData.currency || state.user.currency || 'COP'
        };
        state.user = upgradedUser;
        state.users.push(upgradedUser);
        await persistState(state);
        return sanitizeUser(upgradedUser);
    }

    const nextId = state.users.reduce((maxId, u) => Math.max(maxId, u.id || 0), 1) + 1;
    const newUser = {
        id: nextId,
        name: userData.name ? userData.name.trim() : 'Usuario',
        lastName: userData.lastName ? userData.lastName.trim() : '',
        email: normEmail,
        password: cleanPassword,
        currency: userData.currency || 'COP',
        profilephoto: ''
    };
    state.users.push(newUser);
    state.user = newUser;
    await persistState(state);
    return sanitizeUser(newUser);
}

/**
 * Authenticates a user against local phone storage credentials.
 *
 * @param {string} email - Email address.
 * @param {string} password - Plaintext password.
 * @returns {Promise<object>} Sanitized user object.
 */
export async function loginLocalUser(email, password) {
    const state = await loadLocalState();
    const normEmail = (email || '').trim().toLowerCase();
    const cleanPassword = password ? password.trim() : '';

    let foundUser = state.users.find(
        (u) => (u.email || '').trim().toLowerCase() === normEmail
    );

    if (!foundUser && state.user && (state.user.email || '').trim().toLowerCase() === normEmail) {
        foundUser = state.user;
        state.users.push(foundUser);
    }

    if (
        !foundUser &&
        state.users.length === 0 &&
        state.user &&
        state.user.email === 'usuario@fintrack.com' &&
        state.transactions.length > 0
    ) {
        foundUser = {
            ...state.user,
            email: normEmail,
            password: cleanPassword
        };
        state.user = foundUser;
        state.users.push(foundUser);
        await persistState(state);
        return sanitizeUser(foundUser);
    }

    if (!foundUser) {
        const err = new Error('No se encontro una cuenta con ese correo en el dispositivo. Registrate primero.');
        err.status = 401;
        throw err;
    }

    if (!foundUser.password) {
        foundUser.password = cleanPassword;
        state.user = foundUser;
        await persistState(state);
        return sanitizeUser(foundUser);
    }

    if (foundUser.password !== cleanPassword) {
        const err = new Error('Contrasena incorrecta.');
        err.status = 401;
        throw err;
    }

    state.user = foundUser;
    await persistState(state);
    return sanitizeUser(foundUser);
}

/**
 * Retrieves current local user record.
 *
 * @returns {Promise<object>} Sanitized user profile.
 */
export async function getLocalUser() {
    const state = await loadLocalState();
    return sanitizeUser(state.user);
}

/**
 * Updates local user profile fields and handles password changes.
 *
 * @param {object} fields - User fields to update.
 * @returns {Promise<object>} Updated sanitized user profile.
 */
export async function updateLocalUser(fields) {
    const state = await loadLocalState();
    const currentUser = state.user || {};

    if (fields.password && fields.password.trim().length > 0) {
        if (fields.password.trim().length < 6) {
            const err = new Error('La nueva contrasena debe tener al menos 6 caracteres.');
            err.status = 400;
            throw err;
        }
        if (currentUser.password && fields.currentPassword && currentUser.password !== fields.currentPassword.trim()) {
            const err = new Error('La contrasena actual no coincide.');
            err.status = 401;
            throw err;
        }
        currentUser.password = fields.password.trim();
    }

    if (fields.name !== undefined && fields.name !== null) {
        currentUser.name = fields.name.trim();
    }
    if (fields.lastName !== undefined && fields.lastName !== null) {
        currentUser.lastName = fields.lastName.trim();
    }
    if (fields.email !== undefined && fields.email !== null) {
        currentUser.email = fields.email.trim().toLowerCase();
    }
    if (fields.currency !== undefined && fields.currency !== null) {
        currentUser.currency = fields.currency.toUpperCase().trim();
    }
    if (fields.profilephoto !== undefined) {
        currentUser.profilephoto = fields.profilephoto;
    }

    state.user = currentUser;
    const idx = state.users.findIndex(
        (u) => u.id === currentUser.id || (u.email || '').toLowerCase() === (currentUser.email || '').toLowerCase()
    );
    if (idx !== -1) {
        state.users[idx] = currentUser;
    } else if (currentUser.email && currentUser.email !== 'usuario@fintrack.com') {
        state.users.push(currentUser);
    }

    await persistState(state);
    return sanitizeUser(state.user);
}

/**
 * Retrieves local finance categories.
 *
 * @returns {Promise<Array>} List of categories.
 */
export async function getLocalCategories() {
    const state = await loadLocalState();
    return state.categories;
}

/**
 * Queries local transactions for the active user with filtering and pagination.
 *
 * @param {object} params - Filter parameters.
 * @returns {Promise<object>} Paginated transaction list and summary.
 */
export async function getLocalTransactions(params = {}) {
    const state = await loadLocalState();
    const activeUserId = state.user?.id || 1;
    let list = state.transactions.filter(
        (t) => !t.idUser || t.idUser === activeUserId || state.users.length <= 1
    );

    if (params.type && ['income', 'expense'].includes(params.type)) {
        list = list.filter((t) => t.type === params.type);
    }
    if (params.idCategory) {
        list = list.filter((t) => String(t.idCategory) === String(params.idCategory));
    }
    if (params.paymentMethod) {
        list = list.filter((t) => t.paymentMethod === params.paymentMethod);
    }
    if (params.description) {
        const query = params.description.toLowerCase().trim();
        list = list.filter((t) => (t.description || '').toLowerCase().includes(query));
    }
    if (params.date) {
        list = list.filter((t) => t.date === params.date);
    } else if (params.month) {
        list = list.filter((t) => (t.date || '').startsWith(params.month));
    }

    list.sort((a, b) => {
        if (a.date < b.date) return 1;
        if (a.date > b.date) return -1;
        return (b.id || 0) - (a.id || 0);
    });

    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
    const offset = (page - 1) * limit;

    let totalIncome = 0;
    let totalExpense = 0;
    list.forEach((t) => {
        const val = parseFloat(t.amount) || 0;
        if (t.type === 'income') totalIncome += val;
        else if (t.type === 'expense') totalExpense += val;
    });

    const paged = list.slice(offset, offset + limit).map((t) => {
        const cat = state.categories.find((c) => c.id === t.idCategory);
        return {
            ...t,
            categoryFinance: cat ? { id: cat.id, name: cat.name, type: cat.type } : null
        };
    });

    return {
        total: list.length,
        page,
        totalPages: Math.ceil(list.length / limit) || 1,
        summary: {
            totalIncome: Math.round(totalIncome * 100) / 100,
            totalExpense: Math.round(totalExpense * 100) / 100,
            netBalance: Math.round((totalIncome - totalExpense) * 100) / 100
        },
        transactions: paged
    };
}

/**
 * Creates a new transaction in local device storage.
 *
 * @param {object} trxData - Transaction payload.
 * @returns {Promise<object>} Created transaction with category metadata.
 */
export async function createLocalTransaction(trxData) {
    const state = await loadLocalState();
    const created = {
        id: Date.now(),
        idUser: state.user?.id || 1,
        idCategory: parseInt(trxData.idCategory, 10),
        paymentMethod: trxData.paymentMethod || 'cash',
        type: trxData.type,
        date: trxData.date,
        description: trxData.description || '',
        amount: parseFloat(trxData.amount) || 0
    };

    state.transactions.unshift(created);
    await persistState(state);

    const cat = state.categories.find((c) => c.id === created.idCategory);
    return {
        ...created,
        categoryFinance: cat ? { id: cat.id, name: cat.name, type: cat.type } : null
    };
}

/**
 * Deletes a transaction by ID from local device storage.
 *
 * @param {number|string} id - Transaction ID.
 * @returns {Promise<boolean>} True when removed.
 */
export async function deleteLocalTransaction(id) {
    const state = await loadLocalState();
    state.transactions = state.transactions.filter((t) => String(t.id) !== String(id));
    await persistState(state);
    return true;
}

/**
 * Computes monthly financial summary from local device storage.
 *
 * @param {string} monthParam - Month in YYYY-MM format.
 * @returns {Promise<object>} Monthly summary payload.
 */
export async function getLocalMonthlySummary(monthParam) {
    const state = await loadLocalState();
    const activeUserId = state.user?.id || 1;
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const targetMonth = monthParam || defaultMonth;

    const monthTransactions = state.transactions.filter(
        (t) =>
            (!t.idUser || t.idUser === activeUserId || state.users.length <= 1) &&
            (t.date || '').startsWith(targetMonth)
    );

    monthTransactions.sort((a, b) => {
        if (a.date < b.date) return 1;
        if (a.date > b.date) return -1;
        return (b.id || 0) - (a.id || 0);
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryExpenseMap = {};
    const categoryIncomeMap = {};

    monthTransactions.forEach((trx) => {
        const amt = parseFloat(trx.amount) || 0;
        const cat = state.categories.find((c) => c.id === trx.idCategory);
        const categoryName = cat ? cat.name : 'otros';

        if (trx.type === 'income') {
            totalIncome += amt;
            categoryIncomeMap[categoryName] = (categoryIncomeMap[categoryName] || 0) + amt;
        } else if (trx.type === 'expense') {
            totalExpense += amt;
            categoryExpenseMap[categoryName] = (categoryExpenseMap[categoryName] || 0) + amt;
        }
    });

    const recentTransactions = monthTransactions.slice(0, 5).map((trx) => {
        const cat = state.categories.find((c) => c.id === trx.idCategory);
        return {
            ...trx,
            categoryFinance: cat ? { id: cat.id, name: cat.name, type: cat.type } : null
        };
    });

    return {
        month: targetMonth,
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        balance: Math.round((totalIncome - totalExpense) * 100) / 100,
        transactionCount: monthTransactions.length,
        categoryBreakdown: {
            expense: Object.entries(categoryExpenseMap).map(([name, amount]) => ({
                name,
                amount: Math.round(amount * 100) / 100
            })),
            income: Object.entries(categoryIncomeMap).map(([name, amount]) => ({
                name,
                amount: Math.round(amount * 100) / 100
            }))
        },
        recentTransactions
    };
}
