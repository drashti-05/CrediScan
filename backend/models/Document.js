const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Document = sequelize.define('Document', {
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
    filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
    filePath: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fileSize: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    contentHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    processingStatus: {
        type: DataTypes.ENUM('pending', 'processed', 'failed'),
        defaultValue: 'pending'
    }
}, {
    tableName: 'Document',
    timestamps: true,
    underscored: false,
    indexes: [
        {
            fields: ['contentHash']
        },
        {
            fields: ['userId']
        }
    ]
});

module.exports = Document; 