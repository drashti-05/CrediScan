const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CreditRequest = sequelize.define('CreditRequest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'User',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'denied'),
        defaultValue: 'pending'
    },
    requestedCredits: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: true
    },
    adminResponse: {
        type: DataTypes.STRING,
        allowNull: true
    },
    processedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'User',
            key: 'id'
        }
    }
}, {
    tableName: 'CreditRequest',
    timestamps: true,
    underscored: false
});

module.exports = CreditRequest; 