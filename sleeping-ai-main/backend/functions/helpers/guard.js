// Access to Firebase service
const admin = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");

// Time windows in milliseconds
const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

async function ensureAllowed(uid, bucket, limits = {}) {
  if (!uid) return;

  const col = admin.firestore().collection("rate_limits");
  const id = `${uid}__${bucket}`;
  const now = Date.now();

  await admin.firestore().runTransaction(async (t) => {
    const ref = col.doc(id);
    const snap = await t.get(ref);
    const data = snap.exists ? snap.data() : {};

   // Load previous counters or start fresh
    let minuteStart = typeof data.minuteStart === "number" ? data.minuteStart : now;
    let hourStart = typeof data.hourStart === "number" ? data.hourStart : now;
    let dayStart = typeof data.dayStart === "number" ? data.dayStart : now;

    let minuteCount = typeof data.minuteCount === "number" ? data.minuteCount : 0;
    let hourCount = typeof data.hourCount === "number" ? data.hourCount : 0;
    let dayCount = typeof data.dayCount === "number" ? data.dayCount : 0;

   // Reset windows if expired
    if (now - minuteStart >= ONE_MINUTE) {
      minuteStart = now;
      minuteCount = 0;
    }
    if (now - hourStart >= ONE_HOUR) {
      hourStart = now;
      hourCount = 0;
    }
    if (now - dayStart >= ONE_DAY) {
      dayStart = now;
      dayCount = 0;
    }

   // Check rate limits
    if (typeof limits.perMinute === "number" && minuteCount >= limits.perMinute) {
      throw new Error("Rate limit: too many requests this minute");
    }
    if (typeof limits.perHour === "number" && hourCount >= limits.perHour) {
      throw new Error("Rate limit: too many requests this hour");
    }
    if (typeof limits.perDay === "number" && dayCount >= limits.perDay) {
      throw new Error("Rate limit: too many requests today");
    }

    // Increment usage counters
    minuteCount++;
    hourCount++;
    dayCount++;

    // Save updated counters
    t.set(
      ref,
      {
        uid,
        bucket,
        minuteStart,
        hourStart,
        dayStart,
        minuteCount,
        hourCount,
        dayCount,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  });
}

module.exports = { ensureAllowed };
