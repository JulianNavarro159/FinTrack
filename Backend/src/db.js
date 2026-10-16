require("dotenv").config();
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");

const { income = [], expense = [] } = require("../categories.json");
const { paymentMethods = [] } = require("../paymentMethods.json");

// In-memory data store
let userIdCounter = 1;
let categoryIdCounter = 1;
let paymentMethodIdCounter = 1;
let transactionIdCounter = 1;

const usersStore = [];
const categoriesStore = [];
const paymentMethodsStore = [];
const paymentAccountsStore = [];
const transactionsStore = [];

// Helper to wrap object with save & destroy
function wrapUser(data) {
  if (!data) return null;
  const instance = { ...data };
  instance.save = async function () {
    const idx = usersStore.findIndex((u) => u.id === instance.id);
    if (idx !== -1) {
      usersStore[idx] = { ...instance };
    }
    return instance;
  };
  instance.destroy = async function () {
    const idx = usersStore.findIndex((u) => u.id === instance.id);
    if (idx !== -1) {
      usersStore.splice(idx, 1);
    }
  };
  return instance;
}

function wrapTransaction(data) {
  if (!data) return null;
  const instance = { ...data };
  
  // Attach categoryFinance relation
  const cat = categoriesStore.find((c) => c.id === instance.idCategory);
  instance.categoryFinance = cat ? { id: cat.id, name: cat.name, type: cat.type } : null;

  instance.save = async function () {
    const idx = transactionsStore.findIndex((t) => t.id === instance.id);
    if (idx !== -1) {
      transactionsStore[idx] = { ...instance };
      const updatedCat = categoriesStore.find((c) => c.id === instance.idCategory);
      instance.categoryFinance = updatedCat ? { id: updatedCat.id, name: updatedCat.name, type: updatedCat.type } : null;
    }
    return instance;
  };
  instance.destroy = async function () {
    const idx = transactionsStore.findIndex((t) => t.id === instance.id);
    if (idx !== -1) {
      transactionsStore.splice(idx, 1);
    }
  };
  return instance;
}

function wrapCategory(data) {
  if (!data) return null;
  const instance = { ...data };
  instance.save = async function () {
    const idx = categoriesStore.findIndex((c) => c.id === instance.id);
    if (idx !== -1) categoriesStore[idx] = { ...instance };
    return instance;
  };
  return instance;
}

function matchCondition(item, where) {
  if (!where) return true;

  for (const key of Object.keys(where)) {
    const expected = where[key];
    const actual = item[key];

    if (key === 'description' && typeof expected === 'object') {
      const symbols = Object.getOwnPropertySymbols(expected);
      const sym = symbols.find((s) => s.toString().includes('like'));
      if (sym) {
        const rawPattern = expected[sym];
        const searchStr = String(rawPattern).replace(/%/g, '').toLowerCase().trim();
        if (!String(actual || '').toLowerCase().includes(searchStr)) {
          return false;
        }
        continue;
      }
    }

    if (key === 'date' && typeof expected === 'object') {
      const symbols = Object.getOwnPropertySymbols(expected);
      const betweenSym = symbols.find((s) => s.toString().includes('between'));
      const gteSym = symbols.find((s) => s.toString().includes('gte'));
      const lteSym = symbols.find((s) => s.toString().includes('lte'));

      if (betweenSym) {
        const [start, end] = expected[betweenSym];
        if (actual < start || actual > end) return false;
        continue;
      }
      if (gteSym) {
        if (actual < expected[gteSym]) return false;
      }
      if (lteSym) {
        if (actual > expected[lteSym]) return false;
      }
      continue;
    }

    if (expected !== undefined && expected !== null && typeof expected === 'object') {
      const symbols = Object.getOwnPropertySymbols(expected);
      const orSym = symbols.find((s) => s.toString().includes('or'));
      if (orSym) {
        const orConditions = expected[orSym];
        const matchesAny = orConditions.some((cond) => matchCondition(item, cond));
        if (!matchesAny) return false;
        continue;
      }
    }

    if (actual !== expected) {
      return false;
    }
  }

  // Check top-level symbols on where (e.g. [Op.or])
  const topSymbols = Object.getOwnPropertySymbols(where);
  for (const sym of topSymbols) {
    if (sym.toString().includes('or')) {
      const orConds = where[sym];
      const matchesAny = orConds.some((cond) => {
        return Object.entries(cond).every(([k, v]) => item[k] === v);
      });
      if (!matchesAny) return false;
    }
  }

  return true;
}

const CategoryFinance = {
  count: async () => categoriesStore.length,
  bulkCreate: async (arr) => {
    return arr.map((item) => {
      const created = { id: categoryIdCounter++, ...item };
      categoriesStore.push(created);
      return wrapCategory(created);
    });
  },
  findAll: async (options = {}) => {
    let items = categoriesStore.filter((item) => matchCondition(item, options.where));
    if (options.order) {
      items.sort((a, b) => {
        for (const [col, dir] of options.order) {
          const comp = String(a[col] || '').localeCompare(String(b[col] || ''));
          if (comp !== 0) return dir.toUpperCase() === 'DESC' ? -comp : comp;
        }
        return 0;
      });
    }
    return items.map(wrapCategory);
  },
  findOne: async (options = {}) => {
    const item = categoriesStore.find((i) => matchCondition(i, options.where));
    return item ? wrapCategory(item) : null;
  },
  findByPk: async (id) => {
    const item = categoriesStore.find((i) => i.id === parseInt(id, 10));
    return item ? wrapCategory(item) : null;
  },
  create: async (data) => {
    const created = { id: categoryIdCounter++, ...data };
    categoriesStore.push(created);
    return wrapCategory(created);
  }
};

const PaymentMethod = {
  count: async () => paymentMethodsStore.length,
  bulkCreate: async (arr) => {
    return arr.map((item) => {
      const created = { id: paymentMethodIdCounter++, ...item };
      paymentMethodsStore.push(created);
      return created;
    });
  },
  findAll: async () => paymentMethodsStore.map((m) => ({ ...m })),
  findByPk: async (id) => {
    const item = paymentMethodsStore.find((i) => i.id === parseInt(id, 10));
    return item ? { ...item } : null;
  }
};

const PaymentAccount = {
  findAll: async () => [...paymentAccountsStore],
  findByPk: async (id) => paymentAccountsStore.find((i) => i.id === parseInt(id, 10)) || null
};

const User = {
  findOne: async (options = {}) => {
    const user = usersStore.find((u) => matchCondition(u, options.where));
    return user ? wrapUser(user) : null;
  },
  findByPk: async (id, options = {}) => {
    const user = usersStore.find((u) => u.id === parseInt(id, 10));
    if (!user) return null;
    const wrapped = wrapUser(user);
    if (options.attributes) {
      const filtered = {};
      options.attributes.forEach((attr) => {
        filtered[attr] = wrapped[attr];
      });
      filtered.save = wrapped.save;
      filtered.destroy = wrapped.destroy;
      return filtered;
    }
    return wrapped;
  },
  create: async (data) => {
    const created = {
      id: userIdCounter++,
      name: data.name || '',
      lastName: data.lastName || '',
      email: data.email,
      currency: data.currency || 'USD',
      password: data.password || null,
      profilephoto: data.profilephoto || null,
      emailVerified: !!data.emailVerified,
      isAdmin: !!data.isAdmin,
      tokenAuth: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    usersStore.push(created);
    return wrapUser(created);
  }
};

const Transaction = {
  create: async (data) => {
    const created = {
      id: transactionIdCounter++,
      idUser: parseInt(data.idUser, 10),
      idCategory: parseInt(data.idCategory, 10),
      idPaymentAccount: data.idPaymentAccount ? parseInt(data.idPaymentAccount, 10) : null,
      paymentMethod: data.paymentMethod || 'cash',
      type: data.type,
      date: data.date,
      description: data.description || '',
      amount: parseFloat(data.amount) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    transactionsStore.push(created);
    return wrapTransaction(created);
  },
  findByPk: async (id, options = {}) => {
    const item = transactionsStore.find((t) => t.id === parseInt(id, 10));
    return item ? wrapTransaction(item) : null;
  },
  findOne: async (options = {}) => {
    const item = transactionsStore.find((t) => matchCondition(t, options.where));
    return item ? wrapTransaction(item) : null;
  },
  findAll: async (options = {}) => {
    let items = transactionsStore.filter((t) => matchCondition(t, options.where));
    if (options.order) {
      items.sort((a, b) => {
        for (const [col, dir] of options.order) {
          if (a[col] < b[col]) return dir.toUpperCase() === 'DESC' ? 1 : -1;
          if (a[col] > b[col]) return dir.toUpperCase() === 'DESC' ? -1 : 1;
        }
        return 0;
      });
    }
    return items.map(wrapTransaction);
  },
  findAndCountAll: async (options = {}) => {
    let items = transactionsStore.filter((t) => matchCondition(t, options.where));
    const totalCount = items.length;

    if (options.order) {
      items.sort((a, b) => {
        for (const [col, dir] of options.order) {
          if (a[col] < b[col]) return dir.toUpperCase() === 'DESC' ? 1 : -1;
          if (a[col] > b[col]) return dir.toUpperCase() === 'DESC' ? -1 : 1;
        }
        return 0;
      });
    }

    const offset = options.offset || 0;
    const limit = options.limit || 20;
    const paged = items.slice(offset, offset + limit);

    return {
      count: totalCount,
      rows: paged.map(wrapTransaction)
    };
  }
};

const conn = {
  authenticate: async () => {
    console.log('[AI Studio] In-memory database initialized');
    return true;
  },
  sync: async () => {
    return true;
  }
};

// Seed initial system data & demo data
function seedInitialData() {
  if (categoriesStore.length === 0) {
    const catData = [
      ...income.map((name) => ({ name, type: 'income', idUser: null })),
      ...expense.map((name) => ({ name, type: 'expense', idUser: null }))
    ];
    catData.forEach((c) => {
      categoriesStore.push({ id: categoryIdCounter++, ...c });
    });
  }

  if (paymentMethodsStore.length === 0) {
    paymentMethods.forEach((name) => {
      paymentMethodsStore.push({ id: paymentMethodIdCounter++, name });
    });
  }

  if (usersStore.length === 0) {
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('password123', salt);
    const demoUser = {
      id: userIdCounter++,
      name: 'Julian',
      lastName: 'Navarro',
      email: 'demo@fintrack.com',
      currency: 'USD',
      password: demoPasswordHash,
      profilephoto: '',
      emailVerified: true,
      isAdmin: false,
      tokenAuth: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    usersStore.push(demoUser);

    // Seed realistic transactions for demo user
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const ymd = (day) => `${currentYear}-${currentMonth}-${String(day).padStart(2, '0')}`;

    const catSalary = categoriesStore.find((c) => c.name === 'salario') || categoriesStore[0];
    const catInvest = categoriesStore.find((c) => c.name === 'inversiones') || categoriesStore[0];
    const catHome = categoriesStore.find((c) => c.name === 'hogar') || categoriesStore[1];
    const catFood = categoriesStore.find((c) => c.name === 'alimentos') || categoriesStore[1];
    const catTransport = categoriesStore.find((c) => c.name === 'transporte') || categoriesStore[1];
    const catFun = categoriesStore.find((c) => c.name === 'entretenimiento') || categoriesStore[1];

    const demoTransactions = [
      { idUser: 1, idCategory: catSalary?.id || 1, paymentMethod: 'transfer', type: 'income', date: ymd(1), description: 'Salario quincenal', amount: 3200 },
      { idUser: 1, idCategory: catHome?.id || 4, paymentMethod: 'transfer', type: 'expense', date: ymd(2), description: 'Alquiler del departamento', amount: 950 },
      { idUser: 1, idCategory: catFood?.id || 5, paymentMethod: 'credit_card', type: 'expense', date: ymd(5), description: 'Supermercado semanal', amount: 185.5 },
      { idUser: 1, idCategory: catTransport?.id || 8, paymentMethod: 'debit_card', type: 'expense', date: ymd(8), description: 'Combustible', amount: 65 },
      { idUser: 1, idCategory: catInvest?.id || 2, paymentMethod: 'transfer', type: 'income', date: ymd(10), description: 'Rendimientos de inversión', amount: 420 },
      { idUser: 1, idCategory: catFood?.id || 5, paymentMethod: 'credit_card', type: 'expense', date: ymd(12), description: 'Cena restaurante', amount: 78 },
      { idUser: 1, idCategory: catFun?.id || 7, paymentMethod: 'credit_card', type: 'expense', date: ymd(14), description: 'Suscripciones y cine', amount: 42 }
    ];

    demoTransactions.forEach((t) => {
      transactionsStore.push({
        id: transactionIdCounter++,
        ...t,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
  }
}

seedInitialData();

module.exports = {
  conn,
  User,
  Transaction,
  CategoryFinance,
  PaymentMethod,
  PaymentAccount
};
