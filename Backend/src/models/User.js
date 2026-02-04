const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('user', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        profilephoto: {
            type: DataTypes.STRING,
            defaultValue: null,
        },
        emailVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        isAdmin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        tokenAuth: {
            type: DataTypes.STRING(300),
            allowNull: true,
            defaultValue: null
        },
    }, {
        paranoid: true,
    })
}