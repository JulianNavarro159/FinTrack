const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('transaction', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM("income", "expense"),
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        idCategory: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        paymentMethod: {
            type: DataTypes.ENUM("cash", "credit_card", "debit_card", "transfer"),
            allowNull: false,
            defaultValue: "cash"
        },
        idPaymentAccount: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        idUser: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    })
}
