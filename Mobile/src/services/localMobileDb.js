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
            currency: 'COP',
            profilephoto: ''
        },
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

        memoryState = parsed;
        return memoryState;
    } catch {
        const initial = createInitialState();
        memoryState = initial;
        return initial;
    }
}

/**
 * Retrieves local user record.
 *
 * @returns {Promise<object>} User profile.
 */
export async function getLocalUser() {
    const state = await loadLocalState();
    return state.user;
}

/**
 * Updates local user profile fields.
 *
 * @param {object} fields - User fields to update.
 * @returns {Promise<object>} Updated user profile.
 */
export async function updateLocalUser(fields) {
    const state = await loadLocalState();
    state.user = {
        ...state.user,
        ...fields
    };
    await persistState(state);
    return state.user;
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
 * Queries local transactions with filtering and pagination.
 *
 * @param {object} params - Filter parameters.
 * @returns {Promise<object>} Paginated transaction list and summary.
 */
export async function getLocalTransactions(params = {}) {
    const state = await loadLocalState();
    let list = [...state.transactions];

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
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const targetMonth = monthParam || defaultMonth;

    const monthTransactions = state.transactions.filter((t) =>
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
