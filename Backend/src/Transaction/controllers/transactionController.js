const { Op, fn, col, literal } = require("sequelize");
const { Transaction, User, CategoryFinance, PaymentAccount, PaymentMethod } = require("../../db");

/**
 * Creates a new financial transaction for the authenticated user.
 * 
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<import('express').Response>} Express response with created transaction.
 */
const createTransaction = async (req, res) => {
    try {
        const idUser = req.idUser || req.body.idUser;
        const { idCategory, type, date, description, amount, paymentMethod, idPaymentAccount } = req.body;

        if (!idUser || !idCategory || !type || !date || amount === undefined || amount === null) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const validTypes = ["income", "expense"];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ message: "Transaction type must be 'income' or 'expense'" });
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: "Amount must be a positive number" });
        }

        const user = await User.findByPk(idUser);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const category = await CategoryFinance.findByPk(idCategory);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const validPaymentMethods = ["cash", "credit_card", "debit_card", "transfer"];
        const selectedPaymentMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : "cash";

        const newTransaction = await Transaction.create({
            idUser,
            idCategory,
            idPaymentAccount: idPaymentAccount || null,
            paymentMethod: selectedPaymentMethod,
            type,
            date,
            description: description ? description.trim() : "",
            amount: parsedAmount
        });

        const createdRecord = await Transaction.findByPk(newTransaction.id, {
            include: [
                {
                    model: CategoryFinance,
                    attributes: ["id", "name", "type"]
                }
            ]
        });

        return res.status(201).json({
            message: "Transaction created successfully",
            transaction: createdRecord
        });
    } catch (error) {
        return res.status(500).json({ message: "Error creating transaction", error: error.message });
    }
};

/**
 * Retrieves paginated transactions for the authenticated user with multi-criteria filtering.
 * 
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<import('express').Response>} Express response with paginated list and aggregate summary.
 */
const getTransaction = async (req, res) => {
    try {
        const idUser = req.idUser;
        const {
            type,
            date,
            month,
            startDate,
            endDate,
            idCategory,
            paymentMethod,
            description,
            page = 1,
            limit = 20
        } = req.query;

        const where = { idUser };

        if (type && ["income", "expense"].includes(type)) {
            where.type = type;
        }

        if (idCategory) {
            where.idCategory = idCategory;
        }

        if (paymentMethod && ["cash", "credit_card", "debit_card", "transfer"].includes(paymentMethod)) {
            where.paymentMethod = paymentMethod;
        }

        if (description) {
            where.description = { [Op.like]: `%${description.trim()}%` };
        }

        if (date) {
            where.date = date;
        } else if (month) {
            const startOfMonth = `${month}-01`;
            const [yearStr, monthStr] = month.split("-");
            const nextMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();
            const endOfMonth = `${month}-${String(nextMonth).padStart(2, "0")}`;
            where.date = { [Op.between]: [startOfMonth, endOfMonth] };
        } else if (startDate && endDate) {
            where.date = { [Op.between]: [startDate, endDate] };
        } else if (startDate) {
            where.date = { [Op.gte]: startDate };
        } else if (endDate) {
            where.date = { [Op.lte]: endDate };
        }

        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (parsedPage - 1) * parsedLimit;

        const { count, rows: transactions } = await Transaction.findAndCountAll({
            where,
            include: [
                {
                    model: CategoryFinance,
                    attributes: ["id", "name", "type"]
                }
            ],
            order: [["date", "DESC"], ["id", "DESC"]],
            limit: parsedLimit,
            offset
        });

        const allMatchingTransactions = await Transaction.findAll({
            where,
            attributes: ["type", "amount"]
        });

        let totalIncome = 0;
        let totalExpense = 0;
        allMatchingTransactions.forEach((t) => {
            const val = parseFloat(t.amount) || 0;
            if (t.type === "income") {
                totalIncome += val;
            } else if (t.type === "expense") {
                totalExpense += val;
            }
        });

        const netBalance = totalIncome - totalExpense;

        return res.status(200).json({
            total: count,
            page: parsedPage,
            totalPages: Math.ceil(count / parsedLimit),
            summary: {
                totalIncome: Math.round(totalIncome * 100) / 100,
                totalExpense: Math.round(totalExpense * 100) / 100,
                netBalance: Math.round(netBalance * 100) / 100
            },
            transactions
        });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching transactions", error: error.message });
    }
};

/**
 * Computes monthly dashboard metrics for income, expenses, and category breakdown.
 * 
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<import('express').Response>} Express response with aggregated metrics.
 */
const getMonthlySummary = async (req, res) => {
    try {
        const idUser = req.idUser;
        const now = new Date();
        const currentMonthString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const targetMonth = req.query.month || currentMonthString;

        const [yearStr, monthStr] = targetMonth.split("-");
        const daysInMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();
        const startOfMonth = `${targetMonth}-01`;
        const endOfMonth = `${targetMonth}-${String(daysInMonth).padStart(2, "0")}`;

        const monthWhere = {
            idUser,
            date: {
                [Op.between]: [startOfMonth, endOfMonth]
            }
        };

        const monthTransactions = await Transaction.findAll({
            where: monthWhere,
            include: [
                {
                    model: CategoryFinance,
                    attributes: ["id", "name", "type"]
                }
            ],
            order: [["date", "DESC"], ["id", "DESC"]]
        });

        let totalIncome = 0;
        let totalExpense = 0;
        const categoryExpenseMap = {};
        const categoryIncomeMap = {};

        monthTransactions.forEach((trx) => {
            const amt = parseFloat(trx.amount) || 0;
            const categoryName = trx.categoryFinance ? trx.categoryFinance.name : "Uncategorized";

            if (trx.type === "income") {
                totalIncome += amt;
                categoryIncomeMap[categoryName] = (categoryIncomeMap[categoryName] || 0) + amt;
            } else if (trx.type === "expense") {
                totalExpense += amt;
                categoryExpenseMap[categoryName] = (categoryExpenseMap[categoryName] || 0) + amt;
            }
        });

        const recentTransactions = monthTransactions.slice(0, 5);

        return res.status(200).json({
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
        });
    } catch (error) {
        return res.status(500).json({ message: "Error calculating monthly summary", error: error.message });
    }
};

/**
 * Deletes a transaction owned by the authenticated user.
 * 
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<import('express').Response>} Express response with deletion status.
 */
const deleteTransaction = async (req, res) => {
    try {
        const idUser = req.idUser;
        const { id } = req.params;

        const transaction = await Transaction.findOne({ where: { id, idUser } });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        await transaction.destroy();
        return res.status(200).json({ message: "Transaction deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Error deleting transaction", error: error.message });
    }
};

/**
 * Updates an existing transaction owned by the authenticated user.
 * 
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<import('express').Response>} Express response with updated transaction.
 */
const updateTransaction = async (req, res) => {
    try {
        const idUser = req.idUser;
        const { id } = req.params;
        const { idCategory, type, date, description, amount, paymentMethod } = req.body;

        const transaction = await Transaction.findOne({ where: { id, idUser } });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        if (type && !["income", "expense"].includes(type)) {
            return res.status(400).json({ message: "Invalid transaction type" });
        }

        if (amount !== undefined) {
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                return res.status(400).json({ message: "Amount must be a positive number" });
            }
            transaction.amount = parsedAmount;
        }

        if (idCategory) {
            const category = await CategoryFinance.findByPk(idCategory);
            if (!category) {
                return res.status(404).json({ message: "Category not found" });
            }
            transaction.idCategory = idCategory;
        }

        if (type) transaction.type = type;
        if (date) transaction.date = date;
        if (description !== undefined) transaction.description = description.trim();
        if (paymentMethod && ["cash", "credit_card", "debit_card", "transfer"].includes(paymentMethod)) {
            transaction.paymentMethod = paymentMethod;
        }

        await transaction.save();

        const updated = await Transaction.findByPk(transaction.id, {
            include: [{ model: CategoryFinance, attributes: ["id", "name", "type"] }]
        });

        return res.status(200).json({ message: "Transaction updated successfully", transaction: updated });
    } catch (error) {
        return res.status(500).json({ message: "Error updating transaction", error: error.message });
    }
};

module.exports = {
    createTransaction,
    getTransaction,
    getMonthlySummary,
    deleteTransaction,
    updateTransaction
};
