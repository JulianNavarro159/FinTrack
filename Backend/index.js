const server = require('./src/server');
const {conn, CategoryFinance, PaymentMethod} = require('./src/db');
const PORT = process.env.PORT || 3000;

const { income, expense } = require('./categories.json');
const { paymentMethods } = require('./paymentMethods.json');

conn.sync({ alter: true }).then(async () => {
    try {
        const categoryData = [
            ...income.map(name => ({ name, type: 'income' })),
            ...expense.map(name => ({ name, type: 'expense' }))
        ];

        await CategoryFinance.bulkCreate(categoryData);
        console.log("✅ Categorías insertadas correctamente");

        const paymentMethodData = paymentMethods.map(name => ({ name }));
        await PaymentMethod.bulkCreate(paymentMethodData);
        console.log("✅ Métodos de pago insertados correctamente");

        server.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})