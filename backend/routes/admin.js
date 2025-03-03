const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { User, Document, CreditRequest } = require('../models');
// Import sequelize instance directly from config
const sequelize = require('../config/db');

// Get system overview
router.get('/overview', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [
            totalUsers,
            totalDocuments,
            totalPendingRequests,
            totalCreditsIssued
        ] = await Promise.all([
            User.count({ where: { role: 'user' } }),
            Document.count(),
            CreditRequest.count({ where: { status: 'pending' } }),
            CreditRequest.sum('requestedCredits', { where: { status: 'approved' } })
        ]);

        res.json({
            success: true,
            statistics: {
                totalUsers,
                totalDocuments,
                totalPendingRequests,
                totalCreditsIssued: totalCreditsIssued || 0
            }
        });
    } catch (error) {
        console.error('Error in overview:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching overview statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get top users by scan count
router.get('/top-users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const topUsers = await User.findAll({
            where: { role: 'user' },
            attributes: [
                'id',
                'username',
                'credits',
                [Sequelize.literal('(SELECT COUNT(*) FROM Document WHERE Document.userId = User.id)'), 'scanCount']
            ],
            order: [[Sequelize.literal('scanCount'), 'DESC']],
            limit: 10,
            raw: true
        });

        res.json({
            success: true,
            topUsers: topUsers.map(user => ({
                id: user.id,
                username: user.username,
                credits: user.credits,
                scanCount: parseInt(user.scanCount) || 0
            }))
        });
    } catch (error) {
        console.error('Error in top users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching top users',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get daily scan statistics
router.get('/daily-stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const dailyStats = await Document.findAll({
            attributes: [
                [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'scanCount']
            ],
            group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
            order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'DESC']],
            limit: 30
        });

        res.json({
            success: true,
            dailyStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching daily statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get credit usage statistics
router.get('/credit-stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const creditStats = await CreditRequest.findAll({
            attributes: [
                'status',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('requestedCredits')), 'totalCredits']
            ],
            group: ['status']
        });

        const userCreditStats = await User.findAll({
            attributes: [
                [Sequelize.fn('SUM', Sequelize.col('credits')), 'totalAvailableCredits'],
                [Sequelize.fn('AVG', Sequelize.col('credits')), 'averageCredits']
            ]
        });

        res.json({
            success: true,
            creditStats,
            userCreditStats: userCreditStats[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching credit statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get document processing statistics
router.get('/document-stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const processingStats = await Document.findAll({
            attributes: [
                'processingStatus',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['processingStatus']
        });

        const sizeStats = await Document.findAll({
            attributes: [
                [Sequelize.fn('AVG', Sequelize.col('fileSize')), 'averageSize'],
                [Sequelize.fn('MAX', Sequelize.col('fileSize')), 'maxSize'],
                [Sequelize.fn('MIN', Sequelize.col('fileSize')), 'minSize']
            ]
        });

        res.json({
            success: true,
            processingStats,
            sizeStats: sizeStats[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching document statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get all credit requests
router.get('/credits/requests', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        console.log('Fetching credit requests...');
        
        const requests = await CreditRequest.findAll({
            where: { status: 'pending' },
            include: [{
                model: User,
                as: 'user',
                attributes: ['username']
            }],
            order: [['createdAt', 'DESC']]
        });

        console.log('Credit requests found:', requests.length);

        res.json({
            success: true,
            requests: requests.map(request => ({
                id: request.id,
                userId: request.userId,
                username: request.user ? request.user.username : 'Unknown',
                requestedCredits: request.requestedCredits,
                status: request.status,
                reason: request.reason,
                adminResponse: request.adminResponse,
                createdAt: request.createdAt
            }))
        });
    } catch (error) {
        console.error('Error in credit requests:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error fetching credit requests',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Approve credit request
router.post('/credits/approve/:requestId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { requestId } = req.params;
        
        // Find the credit request
        const creditRequest = await CreditRequest.findByPk(requestId, {
            include: [{ model: User, as: 'user' }]
        });

        if (!creditRequest) {
            return res.status(404).json({
                success: false,
                message: 'Credit request not found'
            });
        }

        if (creditRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Request has already been processed'
            });
        }

        // Start a transaction
        const transaction = await sequelize.transaction();

        try {
            // Update request status
            await creditRequest.update({
                status: 'approved',
                processedBy: req.user.id,
                adminResponse: 'Request approved'
            }, { transaction });

            // Add credits to user
            await creditRequest.user.increment('credits', {
                by: creditRequest.requestedCredits,
                transaction
            });

            await transaction.commit();

            res.json({
                success: true,
                message: 'Credit request approved successfully'
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error approving credit request:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing credit request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Deny credit request
router.post('/credits/deny/:requestId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Denial reason is required'
            });
        }

        const creditRequest = await CreditRequest.findByPk(requestId, {
            include: [{ model: User, as: 'user' }]
        });

        if (!creditRequest) {
            return res.status(404).json({
                success: false,
                message: 'Credit request not found'
            });
        }

        if (creditRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Request has already been processed'
            });
        }

        await creditRequest.update({
            status: 'denied',
            processedBy: req.user.id,
            adminResponse: reason
        });

        res.json({
            success: true,
            message: 'Credit request denied successfully'
        });
    } catch (error) {
        console.error('Error denying credit request:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing credit request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Add this new route to modify user credits
router.post('/users/:userId/credits', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const { credits, reason } = req.body;

        if (!credits || isNaN(credits) || credits < 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credit amount'
            });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update user credits
        await user.update({ credits });

        // Log the credit modification
        console.log(`Admin ${req.user.username} modified credits for user ${user.username}: ${credits} (Reason: ${reason || 'No reason provided'})`);

        res.json({
            success: true,
            message: 'Credits updated successfully',
            user: {
                id: user.id,
                username: user.username,
                credits: user.credits
            }
        });
    } catch (error) {
        console.error('Error modifying user credits:', error);
        res.status(500).json({
            success: false,
            message: 'Error modifying user credits',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 