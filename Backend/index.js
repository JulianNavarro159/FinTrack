const server = require('./src/server');
const { conn, CategoryFinance, PaymentMethod } = require('./src/db');

const PORT = process.env.PORT || 3001;

const { income, expense } = require('./categories.json');
const { paymentMethods } = require('./paymentMethods.json');

const startServer = async () => {
    server.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });

    try {
        await conn.authenticate();
        console.log('Database connected successfully');

        await conn.sync();

        const categoryCount = await CategoryFinance.count();
        if (categoryCount === 0) {
            const categoryData = [
                ...income.map((name) => ({ name, type: 'income', idUser: null })),
                ...expense.map((name) => ({ name, type: 'expense', idUser: null }))
            ];
            await CategoryFinance.bulkCreate(categoryData);
            console.log('Categories initialized successfully');
        }

        const paymentMethodCount = await PaymentMethod.count();
        if (paymentMethodCount === 0) {
            const paymentMethodData = paymentMethods.map((name) => ({ name }));
            await PaymentMethod.bulkCreate(paymentMethodData);
            console.log('Payment methods initialized successfully');
        }
    } catch (error) {
        console.error('Database connection/sync warning:', error.message);
    }
};

startServer();