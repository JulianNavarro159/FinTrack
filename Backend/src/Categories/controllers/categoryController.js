const { Op } = require("sequelize");
const { CategoryFinance, PaymentMethod } = require("../../db");

/**
 * Retrieves all categories available to the user (global system categories and user-defined).
 * 
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<import('express').Response>} Express response with categories list.
 */
const getCategories = async (req, res) => {
    try {
        const idUser = req.idUser || null;
        const whereClause = idUser
            ? { [Op.or]: [{ idUser: null }, { idUser }] }
            : { idUser: null };

        const categories = await CategoryFinance.findAll({
            where: whereClause,
            order: [["type", "ASC"], ["name", "ASC"]]
        });

        return res.status(200).json(categories);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching categories", error: error.message });
    }
};

/**
 * Creates a custom financial category for the authenticated user.
 * 
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<import('express').Response>} Express response with created category.
 */
const createCategory = async (req, res) => {
    try {
        const idUser = req.idUser;
        const { name, type } = req.body;

        if (!name || !type) {
            return res.status(400).json({ message: "Category name and type are required" });
        }

        if (!["income", "expense"].includes(type)) {
            return res.status(400).json({ message: "Category type must be 'income' or 'expense'" });
        }

        const trimmedName = name.trim().toLowerCase();
        const existing = await CategoryFinance.findOne({
            where: {
                name: trimmedName,
                type,
                [Op.or]: [{ idUser: null }, { idUser }]
            }
        });

        if (existing) {
            return res.status(409).json({ message: "Category already exists" });
        }

        const newCategory = await CategoryFinance.create({
            name: trimmedName,
            type,
            idUser
        });

        return res.status(201).json(newCategory);
    } catch (error) {
        return res.status(500).json({ message: "Error creating category", error: error.message });
    }
};

/**
 * Retrieves all registered payment methods.
 * 
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<import('express').Response>} Express response with payment methods.
 */
const getPaymentMethods = async (req, res) => {
    try {
        const methods = await PaymentMethod.findAll();
        return res.status(200).json(methods);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching payment methods", error: error.message });
    }
};

module.exports = {
    getCategories,
    createCategory,
    getPaymentMethods
};
