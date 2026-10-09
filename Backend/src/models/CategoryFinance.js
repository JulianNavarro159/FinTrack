const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('categoryFinance', {
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
        type: {
            type: DataTypes.ENUM("income", "expense"),
            allowNull: false
        },
        idUser: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    })
}