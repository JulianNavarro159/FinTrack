const { Op } = require("sequelize");
const { Transaction, User, CategoryFinance, PaymentAccount } = require("../../db");

const createTransaction = async (req, res) => {
    try {
        const { idUser, idCategory, idPaymentAccount, type, date, description, amount } = req.body;

        // Validar que todos los campos requeridos estén presentes
        if (!idUser || !idCategory || !idPaymentAccount || !type || !date || !amount) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }

        // Validar que el tipo sea "income" o "expense"
        const validTypes = ["income", "expense"];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ message: "El tipo de transacción debe ser 'income' o 'expense'" });
        }

        // Verificar que el usuario exista
        const user = await User.findByPk(idUser);
        if (!user) {
            return res.status(404).json({ message: "El usuario no existe" });
        }

        // Verificar que la categoría exista
        const category = await CategoryFinance.findByPk(idCategory);
        if (!category) {
            return res.status(404).json({ message: "La categoría no existe" });
        }

        // Verificar que la cuenta de pago exista
        const paymentAccount = await PaymentAccount.findByPk(idPaymentAccount);
        if (!paymentAccount) {
            return res.status(404).json({ message: "La cuenta de pago no existe" });
        }

        // Crear la nueva transacción
        const newTransaction = await Transaction.create({
            idUser,
            idCategory,
            idPaymentAccount,
            type,
            date,
            description,
            amount
        });

        return res.status(201).json({ message: "Transacción creada con éxito", transaction: newTransaction });
    } catch (error) {
        console.error("Error en createTransaction:", error);
        return res.status(500).json({ message: "Error al crear la transacción", error: error.message });
    }
};

const getTransaction = async (req, res) => {
    try {
        const { type, date, description, amount, page = 1, limit = 10 } = req.query;
        const idUser = req.idUser; // Asumo que el ID del usuario viene del middleware de autenticación

        const where = { idUser };

        if (date) where.date = date;
        if (type) where.type = type;
        if (description) where.description = { [Op.like]: `%${description}%` }; // Búsqueda parcial en la descripción
        if (amount) where.amount = amount;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows: transactions } = await Transaction.findAndCountAll({
            where,
            include: [
                {
                    model: CategoryFinance,
                    attributes: ["id", "name"]
                },
                {
                    model: PaymentAccount,
                    attributes: ["id", "name"],
                    include: [
                        {
                            model: require("../../db").PaymentMethod,
                            attributes: ["id", "name"]
                        }
                    ]
                }
            ],
            order: [["date", "DESC"]],
            limit: parseInt(limit),
            offset
        });

        return res.status(200).json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            transactions
        });
    } catch (error) {
        console.error("Error en getTransaction:", error);
        return res.status(500).json({ message: "Error al obtener las transacciones", error: error.message });
    }
};

module.exports = { 
    createTransaction,
    getTransaction
};
