// Functions Firebase v2 API
const { admin, logger } = require("../core/bootstrap");
const { onSchedule } = require("firebase-functions/v2/scheduler");

// Scheduled task to clean up old audio files in Cloud Storage
exports.cleanupOldAudio = onSchedule(
  {
    schedule: "every 24 hours",
    timeZone: "Etc/UTC",
    retryCount: 3,
  },
  async () => {
    try {
      const bucket = admin.storage().bucket();
      const [files] = await bucket.getFiles({ prefix: "stories/" });

      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
      let deleted = 0;

// Cleanup old files
      for (const f of files) {
        const [meta] = await f.getMetadata();
        const ts = new Date(meta.timeCreated).getTime();
        if (ts < cutoff) {
          try {
            await f.delete();
            deleted += 1;
          } catch (e) {
            logger.warn("Failed to delete file:", f.name, e.message);
          }
        }
      }
      logger.info(`cleanupOldAudio: deleted ${deleted} old files.`);
    } catch (err) {
      logger.error("cleanupOldAudio error:", err);
    }
  }
);
