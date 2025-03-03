const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { User, CreditRequest } = require('../models');
const { Op } = require('sequelize');

// Get user's credit balance
router.get('/balance', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        res.json({
            success: true,
            credits: user.credits
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching credit balance',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Request additional credits
router.post('/request', authMiddleware, async (req, res) => {
    try {
        const { requestedCredits, reason } = req.body;

        if (!requestedCredits || requestedCredits <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credit amount requested'
            });
        }

        const creditRequest = await CreditRequest.create({
            userId: req.user.id,
            requestedCredits,
            reason,
            status: 'pending'
        });

        res.json({
            success: true,
            message: 'Credit request submitted successfully',
            request: creditRequest
        });
    } catch (error) {
        console.error('Error creating credit request:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting credit request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Admin: Get all credit requests
router.get('/requests', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const requests = await CreditRequest.findAll({
            where: {
                status: 'pending'
            },
            include: [{
                model: User,
                attributes: ['username']
            }],
            order: [['createdAt', 'ASC']]
        });

        res.json({
            success: true,
            requests
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching credit requests',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Admin: Approve credit request
router.post('/approve/:requestId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await CreditRequest.findByPk(requestId, {
            include: [{ model: User }]
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Credit request not found'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Request has already been processed'
            });
        }

        // Update request status
        await request.update({
            status: 'approved',
            processedBy: req.user.id
        });

        // Add credits to user
        await request.User.increment('credits', {
            by: request.requestedCredits
        });

        res.json({
            success: true,
            message: 'Credit request approved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error approving credit request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Admin: Deny credit request
router.post('/deny/:requestId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { reason } = req.body;
        
        const request = await CreditRequest.findByPk(requestId);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Credit request not found'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Request has already been processed'
            });
        }

        await request.update({
            status: 'denied',
            processedBy: req.user.id,
            adminResponse: reason
        });

        res.json({
            success: true,
            message: 'Credit request denied successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error denying credit request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 