const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('paymentAccount', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        idPaymentMethod: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        idUser: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    })
}
