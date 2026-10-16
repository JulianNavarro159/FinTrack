// FinTrack Local Storage Database Engine
// Provides full persistence directly on the user's phone / device browser.

const STORAGE_KEY = 'fintrack_local_data_v1';

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'salario', type: 'income', idUser: null },
  { id: 2, name: 'inversiones', type: 'income', idUser: null },
  { id: 3, name: 'otros', type: 'income', idUser: null },
  { id: 4, name: 'compras', type: 'expense', idUser: null },
  { id: 5, name: 'alimentos', type: 'expense', idUser: null },
  { id: 6, name: 'telefonica', type: 'expense', idUser: null },
  { id: 7, name: 'entretenimiento', type: 'expense', idUser: null },
  { id: 8, name: 'educacion', type: 'expense', idUser: null },
  { id: 9, name: 'salud', type: 'expense', idUser: null },
  { id: 10, name: 'deportes', type: 'expense', idUser: null },
  { id: 11, name: 'transporte', type: 'expense', idUser: null },
  { id: 12, name: 'ropa', type: 'expense', idUser: null },
  { id: 13, name: 'viajes', type: 'expense', idUser: null },
  { id: 14, name: 'hijos', type: 'expense', idUser: null },
  { id: 15, name: 'verduras', type: 'expense', idUser: null },
  { id: 16, name: 'frutas', type: 'expense', idUser: null },
  { id: 17, name: 'auto', type: 'expense', idUser: null },
  { id: 18, name: 'hogar', type: 'expense', idUser: null },
  { id: 19, name: 'mascota', type: 'expense', idUser: null },
  { id: 20, name: 'reparaciones', type: 'expense', idUser: null },
  { id: 21, name: 'otros', type: 'expense', idUser: null }
];

const DEFAULT_PAYMENT_METHODS = [
  { id: 1, name: 'cash' },
  { id: 2, name: 'credit_card' },
  { id: 3, name: 'debit_card' },
  { id: 4, name: 'transfer' }
];

function getInitialState() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const ymd = (d) => `${year}-${month}-${String(d).padStart(2, '0')}`;

  return {
    user: {
      id: 1,
      name: 'Julian',
      lastName: 'Navarro',
      email: 'demo@fintrack.com',
      currency: 'USD',
      profilephoto: ''
    },
    categories: DEFAULT_CATEGORIES,
    paymentMethods: DEFAULT_PAYMENT_METHODS,
    transactions: [
      { id: 1, idUser: 1, idCategory: 1, paymentMethod: 'transfer', type: 'income', date: ymd(1), description: 'Salario quincenal', amount: 3200 },
      { id: 2, idUser: 1, idCategory: 18, paymentMethod: 'transfer', type: 'expense', date: ymd(2), description: 'Alquiler del departamento', amount: 950 },
      { id: 3, idUser: 1, idCategory: 5, paymentMethod: 'credit_card', type: 'expense', date: ymd(5), description: 'Supermercado semanal', amount: 185.5 },
      { id: 4, idUser: 1, idCategory: 11, paymentMethod: 'debit_card', type: 'expense', date: ymd(8), description: 'Combustible', amount: 65 },
      { id: 5, idUser: 1, idCategory: 2, paymentMethod: 'transfer', type: 'income', date: ymd(10), description: 'Rendimientos de inversión', amount: 420 },
      { id: 6, idUser: 1, idCategory: 5, paymentMethod: 'credit_card', type: 'expense', date: ymd(12), description: 'Cena restaurante', amount: 78 },
      { id: 7, idUser: 1, idCategory: 7, paymentMethod: 'credit_card', type: 'expense', date: ymd(14), description: 'Suscripciones y cine', amount: 42 }
    ]
  };
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialState();
      saveData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.transactions || !parsed.categories) {
      const initial = getInitialState();
      saveData(initial);
      return initial;
    }
    return parsed;
  } catch (err) {
    console.warn('[LocalStorageDB] Error loading local storage:', err);
    return getInitialState();
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('[LocalStorageDB] Error saving to local storage:', err);
  }
}

// User methods
export function getLocalUser() {
  const data = loadData();
  return data.user;
}

export function updateLocalUser(fields) {
  const data = loadData();
  data.user = { ...data.user, ...fields };
  saveData(data);
  return data.user;
}

// Categories
export function getLocalCategories() {
  const data = loadData();
  return data.categories;
}

export function createLocalCategory(cat) {
  const data = loadData();
  const newCat = {
    id: Date.now(),
    name: cat.name.trim().toLowerCase(),
    type: cat.type,
    idUser: data.user?.id || 1
  };
  data.categories.push(newCat);
  saveData(data);
  return newCat;
}

// Payment Methods
export function getLocalPaymentMethods() {
  const data = loadData();
  return data.paymentMethods;
}

// Transactions
export function getLocalTransactions(params = {}) {
  const data = loadData();
  let list = [...data.transactions];

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
    const q = params.description.toLowerCase().trim();
    list = list.filter((t) => (t.description || '').toLowerCase().includes(q));
  }
  if (params.date) {
    list = list.filter((t) => t.date === params.date);
  } else if (params.month) {
    list = list.filter((t) => (t.date || '').startsWith(params.month));
  }

  // Sort descending by date, id
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

  const paged = list.slice(offset, offset + limit);

  // Attach categoryFinance
  const enriched = paged.map((t) => {
    const cat = data.categories.find((c) => c.id === t.idCategory);
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
    transactions: enriched
  };
}

export function createLocalTransaction(trxData) {
  const data = loadData();
  const created = {
    id: Date.now(),
    idUser: data.user?.id || 1,
    idCategory: parseInt(trxData.idCategory, 10),
    paymentMethod: trxData.paymentMethod || 'cash',
    type: trxData.type,
    date: trxData.date,
    description: trxData.description || '',
    amount: parseFloat(trxData.amount) || 0
  };
  data.transactions.unshift(created);
  saveData(data);

  const cat = data.categories.find((c) => c.id === created.idCategory);
  return {
    ...created,
    categoryFinance: cat ? { id: cat.id, name: cat.name, type: cat.type } : null
  };
}

export function updateLocalTransaction(id, trxData) {
  const data = loadData();
  const idx = data.transactions.findIndex((t) => String(t.id) === String(id));
  if (idx === -1) throw new Error('Transaction not found');

  const existing = data.transactions[idx];
  const updated = {
    ...existing,
    ...trxData,
    id: existing.id,
    amount: trxData.amount !== undefined ? parseFloat(trxData.amount) : existing.amount,
    idCategory: trxData.idCategory !== undefined ? parseInt(trxData.idCategory, 10) : existing.idCategory
  };

  data.transactions[idx] = updated;
  saveData(data);

  const cat = data.categories.find((c) => c.id === updated.idCategory);
  return {
    ...updated,
    categoryFinance: cat ? { id: cat.id, name: cat.name, type: cat.type } : null
  };
}

export function deleteLocalTransaction(id) {
  const data = loadData();
  data.transactions = data.transactions.filter((t) => String(t.id) !== String(id));
  saveData(data);
  return true;
}

export function getLocalMonthlySummary(monthParam) {
  const data = loadData();
  const now = new Date();
  const currentMonthString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const targetMonth = monthParam || currentMonthString;

  const monthTransactions = data.transactions.filter((t) => (t.date || '').startsWith(targetMonth));

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
    const cat = data.categories.find((c) => c.id === trx.idCategory);
    const categoryName = cat ? cat.name : 'Uncategorized';

    if (trx.type === 'income') {
      totalIncome += amt;
      categoryIncomeMap[categoryName] = (categoryIncomeMap[categoryName] || 0) + amt;
    } else if (trx.type === 'expense') {
      totalExpense += amt;
      categoryExpenseMap[categoryName] = (categoryExpenseMap[categoryName] || 0) + amt;
    }
  });

  const recentTransactions = monthTransactions.slice(0, 5).map((trx) => {
    const cat = data.categories.find((c) => c.id === trx.idCategory);
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

// Backup & Cloud Export / Import
export function exportLocalDataJson() {
  const data = loadData();
  return JSON.stringify(data, null, 2);
}

export function importLocalDataJson(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
      throw new Error('El archivo no contiene un formato válido de FinTrack.');
    }
    saveData(parsed);
    return true;
  } catch (err) {
    throw new Error('Archivo de copia inválido: ' + err.message);
  }
}
