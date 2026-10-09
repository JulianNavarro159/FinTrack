export const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'Dólar (USD)' },
    { code: 'COP', symbol: '$', name: 'Peso colombiano (COP)' },
    { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
    { code: 'MXN', symbol: '$', name: 'Peso mexicano (MXN)' },
    { code: 'ARS', symbol: '$', name: 'Peso argentino (ARS)' },
    { code: 'CLP', symbol: '$', name: 'Peso chileno (CLP)' },
    { code: 'PEN', symbol: 'S/', name: 'Sol peruano (PEN)' },
    { code: 'BRL', symbol: 'R$', name: 'Real brasileño (BRL)' },
    { code: 'GBP', symbol: '£', name: 'Libra esterlina (GBP)' }
];

export const getCurrencySymbol = (code = 'USD') => {
    const found = CURRENCIES.find(c => c.code === code);
    return found ? found.symbol : '$';
};

export const formatCurrency = (amount, currencyCode = 'USD') => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    const symbol = getCurrencySymbol(currencyCode);
    const parts = num.toFixed(num % 1 === 0 ? 0 : 2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decimalPart = parts[1] ? `,${parts[1]}` : '';
    return `${symbol} ${integerPart}${decimalPart}`;
};

export const PAYMENT_METHODS = [
    { id: 'cash', name: 'Efectivo', incomeLabel: 'Efectivo', expenseLabel: 'Efectivo' },
    { id: 'transfer', name: 'Transferencia', incomeLabel: 'Transferencia bancaria', expenseLabel: 'Transferencia' },
    { id: 'credit_card', name: 'Tarjeta de Crédito', incomeLabel: 'Tarjeta de Crédito', expenseLabel: 'Tarjeta de Crédito' },
    { id: 'debit_card', name: 'Tarjeta de Débito', incomeLabel: 'Tarjeta de Débito', expenseLabel: 'Tarjeta de Débito' }
];

export const getPaymentMethodLabel = (methodId, type = 'expense') => {
    const item = PAYMENT_METHODS.find(m => m.id === methodId);
    if (!item) return methodId || 'Efectivo';
    return type === 'income' ? item.incomeLabel : item.expenseLabel;
};
