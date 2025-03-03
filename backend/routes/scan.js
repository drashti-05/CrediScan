const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/authMiddleware');
const { Document, User } = require('../models');
const TextMatcher = require('../utils/textMatching');
const sequelize = require('../config/db');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        console.log('Upload path:', uploadPath); // Debug log
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = uniqueSuffix + path.extname(file.originalname);
        console.log('Generated filename:', filename); // Debug log
        cb(null, filename);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        console.log('Uploaded file:', file); // Debug log
        if (file.mimetype !== 'text/plain') {
            return cb(new Error('Only .txt files are allowed'));
        }
        cb(null, true);
    }
});

// Upload and scan document
router.post('/upload', authMiddleware, async (req, res) => {
    const uploadSingle = upload.single('document');

    uploadSingle(req, res, async (err) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }

            const user = await User.findByPk(req.user.id);
            if (user.credits <= 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient credits',
                    creditsRequired: true
                });
            }

            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err instanceof multer.MulterError ? 
                        `Upload error: ${err.message}` : err.message
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            console.log('Processing file:', req.file.filename); // Debug log

            // Process file and find similarities
            const fileContent = fs.readFileSync(req.file.path, 'utf-8');
            const existingDocs = await Document.findAll({
                where: {
                    userId: req.user.id,
                    processingStatus: 'processed'
                }
            });

            const contentHash = crypto.createHash('sha256').update(fileContent).digest('hex');
            
            // Create document record
            const document = await Document.create({
                userId: req.user.id,
                filename: req.file.originalname,
                filePath: req.file.path,
                fileSize: req.file.size,
                contentHash: contentHash,
                processingStatus: 'processed'
            });

            // Find similar documents
            const similarDocs = await TextMatcher.findSimilarDocuments(fileContent, existingDocs);

            // Deduct credit
            await user.decrement('credits');
            await user.reload();

            console.log('Sending response with similar docs:', similarDocs); // Debug log

            // Create response object
            const response = {
                success: true,
                message: 'Document processed successfully',
                document: {
                    id: document.id,
                    filename: document.filename,
                    processingStatus: document.processingStatus
                },
                similarDocuments: similarDocs,
                remainingCredits: user.credits,
                timestamp: Date.now()
            };

            res.status(201).json(response);

        } catch (error) {
            console.error('Upload error:', error);
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({
                success: false,
                message: 'Error processing document',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });
});

// Get document details
router.get('/:documentId', authMiddleware, async (req, res) => {
    try {
        const document = await Document.findOne({
            where: {
                id: req.params.documentId,
                userId: req.user.id
            }
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        res.json({
            success: true,
            document
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching document',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 