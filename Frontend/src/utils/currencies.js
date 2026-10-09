export const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'Dólar estadounidense (USD)' },
    { code: 'COP', symbol: '$', name: 'Peso colombiano (COP)' },
    { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
    { code: 'MXN', symbol: '$', name: 'Peso mexicano (MXN)' },
    { code: 'ARS', symbol: '$', name: 'Peso argentino (ARS)' },
    { code: 'CLP', symbol: '$', name: 'Peso chileno (CLP)' },
    { code: 'PEN', symbol: 'S/', name: 'Sol peruano (PEN)' },
    { code: 'BRL', symbol: 'R$', name: 'Real brasileño (BRL)' },
    { code: 'GBP', symbol: '£', name: 'Libra esterlina (GBP)' }
];

export const getCurrencySymbol = (currencyCode = 'USD') => {
    const found = CURRENCIES.find(c => c.code === currencyCode);
    return found ? found.symbol : '$';
};

export const formatCurrency = (amount, currencyCode = 'USD') => {
    const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    try {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: numericAmount % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2
        }).format(numericAmount);
    } catch {
        const symbol = getCurrencySymbol(currencyCode);
        return `${symbol} ${numericAmount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
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
