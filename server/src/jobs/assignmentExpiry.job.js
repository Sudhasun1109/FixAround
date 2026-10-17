const cron = require('node-cron');
const assignmentService = require('../services/assignment.service');

let isRunning = false;

/**
 * Register assignment expiry cron job
 * Runs every 30 seconds to check and handle pending assignments whose deadline has passed
 */
function startAssignmentExpiryJob() {
  // Pattern: every 30 seconds
  const task = cron.schedule('*/30 * * * * *', async () => {
    if (isRunning) {
      return;
    }

    isRunning = true;
    try {
      const expiredCount = await assignmentService.processExpiredAssignments();
      if (expiredCount > 0) {
        console.log(`[Cron] Processed and reassigned ${expiredCount} expired assignment(s)`);
      }
    } catch (error) {
      console.error('[Cron] Error during expired assignments processing:', error.message);
    } finally {
      isRunning = false;
    }
  });

  console.log('[Cron] Assignment expiry background worker scheduled (every 30s)');
  return task;
}

module.exports = {
  startAssignmentExpiryJob
};
