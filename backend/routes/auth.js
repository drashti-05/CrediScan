require('dotenv').config()
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Add this at the top of the file
const ADMIN_CODE = process.env.ADMIN_REGISTRATION_CODE || 'ADMIN123'; // Set this in your .env file

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        console.log('Registration attempt:', { username, role }); // Debug log

        // Validate input
        if (!username || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Username, password and role are required'
            });
        }

        // Validate role
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role: ${role}. Must be 'user' or 'admin'`
            });
        }

        // Check if username already exists
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Validate admin registration
        const adminCode = role === 'admin' ? ADMIN_CODE : null;

        if (adminCode && role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Invalid admin registration code'
            });
        }

        // Create user
        const user = await User.create({
            username,
            password,
            role,
            credits: 20
        });

        console.log('User created:', { username, role }); // Debug log

        // Generate token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                credits: user.credits
            }
        });
    } catch (error) {
        console.error('Registration error:', error); // Debug log
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        console.log('Login attempt:', { username, role }); // Debug log

        // First check if user exists with any role
        const anyUser = await User.findOne({ where: { username } });
        if (!anyUser) {
            return res.status(401).json({
                success: false,
                message: 'User does not exist'
            });
        }

        // Then check if user has the correct role
        const userWithRole = await User.findOne({ 
            where: { 
                username,
                role 
            } 
        });
        
        if (!userWithRole) {
            return res.status(401).json({
                success: false,
                message: `Invalid role. User exists but is not a ${role}`
            });
        }

        // Finally check password
        const isValidPassword = await userWithRole.validatePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

        // Generate token
        const token = jwt.sign(
            { userId: userWithRole.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: userWithRole.id,
                username: userWithRole.username,
                role: userWithRole.role,
                credits: userWithRole.credits
            }
        });
    } catch (error) {
        console.error('Login error:', error); // Debug log
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Debug route - remove in production
router.get('/debug/users', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['username', 'role', 'createdAt']
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 