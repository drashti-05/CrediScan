const { Sequelize } = require('sequelize');
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false, // Disable logging
    define: {
        // Prevent Sequelize from creating backup tables during sync
        timestamps: true,
        freezeTableName: true
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Test database connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

// Initialize database
const initializeDatabase = async () => {
    await testConnection();
    
    try {
        // Sync without force to preserve data
        await sequelize.sync({ force: false });
        console.log('Database synced successfully');
        
        // Check if admin exists
        const { User } = require('../models');
        const adminExists = await User.findOne({ 
            where: { role: 'admin' } 
        });
        
        // Create default admin only if no admin exists
        if (!adminExists) {
            await User.create({
                username: 'admin',
                password: 'admin123',
                role: 'admin'
            });
            console.log('Default admin user created');
        }
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

// Initialize on startup
initializeDatabase();

module.exports = sequelize; 