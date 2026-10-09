require('dotenv').config();

const { conn, CategoryFinance, PaymentMethod } = require('../src/db');
const { income, expense } = require('../categories.json');
const { paymentMethods } = require('../paymentMethods.json');

/**
 * Resets the database schema and seeds default reference records.
 *
 * @returns {Promise<void>}
 */
const resetDatabase = async () => {
    try {
        console.log('Connecting and recreating database schema...');
        await conn.sync({ force: true });
        console.log('All tables dropped and recreated.');

        const categoryData = [
            ...income.map((name) => ({ name, type: 'income', idUser: null })),
            ...expense.map((name) => ({ name, type: 'expense', idUser: null }))
        ];
        await CategoryFinance.bulkCreate(categoryData);
        console.log(`Seeded ${categoryData.length} categories.`);

        const paymentMethodData = paymentMethods.map((name) => ({ name }));
        await PaymentMethod.bulkCreate(paymentMethodData);
        console.log(`Seeded ${paymentMethodData.length} payment methods.`);

        console.log('Database successfully reset and seeded.');
        process.exit(0);
    } catch (error) {
        console.error('Database reset failed:', error.message);
        process.exit(1);
    }
};

resetDatabase();
