const server = require('./src/server');
const { conn, CategoryFinance, PaymentMethod } = require('./src/db');

const PORT = process.env.PORT || 3001;

const { income, expense } = require('./categories.json');
const { paymentMethods } = require('./paymentMethods.json');

const initializeDatabase = async () => {
    try {
        await conn.sync({ alter: true });
        
        const categoryCount = await CategoryFinance.count();
        if (categoryCount === 0) {
            const categoryData = [
                ...income.map(name => ({ name, type: 'income', idUser: null })),
                ...expense.map(name => ({ name, type: 'expense', idUser: null }))
            ];
            await CategoryFinance.bulkCreate(categoryData);
            console.log('Categories initialized successfully');
        }

        const paymentMethodCount = await PaymentMethod.count();
        if (paymentMethodCount === 0) {
            const paymentMethodData = paymentMethods.map(name => ({ name }));
            await PaymentMethod.bulkCreate(paymentMethodData);
            console.log('Payment methods initialized successfully');
        }

        server.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize database:', error.message);
    }
};

initializeDatabase();