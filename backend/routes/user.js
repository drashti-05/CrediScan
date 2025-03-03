const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { User, Document, CreditRequest } = require('../models');

// Get basic user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'username', 'credits', 'role']
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile'
        });
    }
});

// Get user's credit requests
router.get('/credit-requests', authMiddleware, async (req, res) => {
    try {
        const creditRequests = await CreditRequest.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            creditRequests
        });
    } catch (error) {
        console.error('Error fetching credit requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching credit requests'
        });
    }
});

// Get user's scan history
router.get('/scan-history', authMiddleware, async (req, res) => {
    try {
        const documents = await Document.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            documents
        });
    } catch (error) {
        console.error('Error fetching scan history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching scan history'
        });
    }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { password } = req.body;
        const updates = {};

        if (password) {
            updates.password = password;
        }

        await req.user.update(updates);

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 