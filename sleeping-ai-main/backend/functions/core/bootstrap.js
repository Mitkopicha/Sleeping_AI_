// Functions Firebase
const admin = require("firebase-admin");
const { setGlobalOptions } = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");

// Initialize Admin SDK 
if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket: "bed-stories-bff80.firebasestorage.app",
  });
}

// OpenAI/ TTS/ ffmpeg
setGlobalOptions({
  region: "us-central1",
  maxInstances: 10,
  timeoutSeconds: 300,
  memoryMiB: 512,
});

module.exports = { admin, logger };


