// Functions Firebase v2 API
const { admin, logger } = require("../core/bootstrap");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

// Import rate limiter
const { ensureAllowed } = require("../helpers/guard");

exports.likeStory = onCall(async (request) => {
  try {
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError("unauthenticated", "Must be signed in to like stories.");
    }
    const uid = request.auth.uid;

    const storyId = String((request.data && request.data.storyId) || "").trim();
    const action = String((request.data && request.data.action) || "like").toLowerCase();

    if (!storyId) {
      throw new HttpsError("invalid-argument", "Provide storyId.");
    }
    if (!["like", "unlike"].includes(action)) {
      throw new HttpsError("invalid-argument", "action must be 'like' or 'unlike'.");
    }

  // Rate limiting max 10 likes per minute, 200 per day)
    await ensureAllowed(uid, "like_story", { perMinute: 10, perDay: 200 });

    const storyRef = admin.firestore().collection("stories").doc(storyId);

    await admin.firestore().runTransaction(async (t) => {
      const snap = await t.get(storyRef);
      if (!snap.exists) {
        throw new HttpsError("not-found", "Story not found.");
      }

      const data = snap.data();
      let likes = Array.isArray(data.likes) ? data.likes : [];

      if (action === "like") {
        if (!likes.includes(uid)) {
          likes.push(uid);
        }
      } else {
        likes = likes.filter((u) => u !== uid);
      }

      t.update(storyRef, { likes });
    });

    return { success: true, action, storyId };
  } catch (err) {
    logger.error("likeStory error:", err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", "Failed to update like.");
  }
});
