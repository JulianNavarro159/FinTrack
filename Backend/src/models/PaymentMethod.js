const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('paymentMethod', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.ENUM("cash", "credit_card", "debit_card", "transfer"),
            allowNull: false
        }
    })
}
