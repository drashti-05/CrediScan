const schedule = require('node-schedule');
const { User } = require('../models');
const { Op } = require('sequelize');

let resetJob = null;

const setupCreditReset = () => {
    // Cancel existing job if any
    if (resetJob) {
        resetJob.cancel();
    }

    // Schedule new job to run at midnight
    resetJob = schedule.scheduleJob('0 0 * * *', async () => {
        try {
            // Reset credits for non-admin users only
            await User.update(
                { credits: 20 },
                {
                    where: {
                        role: {
                            [Op.ne]: 'admin'
                        }
                    },
                    silent: true // Prevent triggering hooks
                }
            );
            console.log('Daily credit reset completed successfully');
        } catch (error) {
            console.error('Error in daily credit reset:', error);
        }
    });

    console.log('Credit reset scheduler initialized');
};

module.exports = setupCreditReset; 