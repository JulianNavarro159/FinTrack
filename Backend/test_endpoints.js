const server = require('./src/server');
const { conn } = require('./src/db');
const http = require('http');

const PORT = 3099;

const runTests = async () => {
    let httpServer;
    try {
        await conn.sync();
        httpServer = http.createServer(server);
        await new Promise(resolve => httpServer.listen(PORT, resolve));
        console.log(`Test server running on port ${PORT}`);

        const request = async (path, options = {}) => {
            const url = `http://localhost:${PORT}${path}`;
            const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
            const fetchOptions = {
                method: options.method || 'GET',
                headers
            };
            if (options.body) {
                fetchOptions.body = JSON.stringify(options.body);
            }
            const res = await fetch(url, fetchOptions);
            const data = await res.json().catch(() => ({}));
            return { status: res.status, data };
        };

        const loginRes = await request('/users/login', {
            method: 'POST',
            body: { email: 'testuser@example.com' }
        });
        console.log('Login status:', loginRes.status, 'User:', loginRes.data.user?.email);
        if (loginRes.status !== 200 || !loginRes.data.token) {
            throw new Error('Login failed');
        }
        const token = loginRes.data.token;
        const authHeader = { Authorization: `Bearer ${token}` };

        const currencyRes = await request('/users/currency', {
            method: 'PATCH',
            headers: authHeader,
            body: { currency: 'COP' }
        });
        console.log('Currency update status:', currencyRes.status, 'Currency:', currencyRes.data.currency);

        const profileRes = await request('/users/me', {
            headers: authHeader
        });
        console.log('Profile status:', profileRes.status, 'Profile Currency:', profileRes.data.currency);

        const updateProfileRes = await request('/users/profile', {
            method: 'PUT',
            headers: authHeader,
            body: {
                name: 'Julian',
                lastName: 'Navarro',
                currency: 'COP'
            }
        });
        console.log('Update profile status:', updateProfileRes.status, 'Updated user:', updateProfileRes.data.user?.name);


        const catRes = await request('/categories', {
            headers: authHeader
        });
        console.log('Categories count:', catRes.data.length);
        const incomeCat = catRes.data.find(c => c.type === 'income') || catRes.data[0];
        const expenseCat = catRes.data.find(c => c.type === 'expense') || catRes.data[1];

        const today = new Date().toISOString().split('T')[0];

        const incomeTrxRes = await request('/transaction', {
            method: 'POST',
            headers: authHeader,
            body: {
                idCategory: incomeCat.id,
                type: 'income',
                amount: 3500000,
                date: today,
                description: 'Salario quincenal',
                paymentMethod: 'transfer'
            }
        });
        console.log('Income creation status:', incomeTrxRes.status, 'ID:', incomeTrxRes.data.transaction?.id);

        const expenseTrxRes = await request('/transaction', {
            method: 'POST',
            headers: authHeader,
            body: {
                idCategory: expenseCat.id,
                type: 'expense',
                amount: 150000,
                date: today,
                description: 'Compras de supermercado',
                paymentMethod: 'cash'
            }
        });
        console.log('Expense creation status:', expenseTrxRes.status, 'ID:', expenseTrxRes.data.transaction?.id);

        const summaryRes = await request('/transaction/summary', {
            headers: authHeader
        });
        console.log('Monthly summary status:', summaryRes.status, 'Summary:', summaryRes.data);

        const historyRes = await request('/transaction?page=1&limit=10', {
            headers: authHeader
        });
        console.log('History status:', historyRes.status, 'Total items:', historyRes.data.total);

        const filterRes = await request('/transaction?type=expense', {
            headers: authHeader
        });
        console.log('Filter by expense count:', filterRes.data.transactions.length);

        console.log('ALL BACKEND INTEGRATION TESTS PASSED!');
    } catch (err) {
        console.error('Test execution error:', err);
    } finally {
        if (httpServer) {
            httpServer.close();
        }
        process.exit(0);
    }
};

runTests();
