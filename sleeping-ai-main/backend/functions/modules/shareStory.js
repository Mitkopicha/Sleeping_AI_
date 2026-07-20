// Make a user's story public and create/refresh its community listing
const { admin, logger } = require("../core/bootstrap");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { ensureAllowed } = require("../helpers/guard");
const { awardBadge } = require("./badges");
const { Timestamp } = require("firebase-admin/firestore");

exports.shareStory = onCall({}, async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Login required.");
  }
  const uid = request.auth.uid;
  const storyId = String(((request.data && request.data.storyId) || "")).trim();
  if (!storyId) throw new HttpsError("invalid-argument", "Provide storyId.");

  // Rate limit/protect against abuse
  await ensureAllowed(uid, "share_story", { perMinute: 6, perHour: 60, perDay: 300 });

  const storyRef = admin.firestore().collection("stories").doc(storyId);
  const storySnap = await storyRef.get();
  if (!storySnap.exists) throw new HttpsError("not-found", "Story not found.");
  const story = storySnap.data() || {};
  if (story.uid !== uid) throw new HttpsError("permission-denied", "Not your story.");

  // Flip visibility to public and upsert into community collection
  const pubRef = admin.firestore().collection("community_stories").doc(storyId);
  await admin.firestore().runTransaction(async (t) => {
    t.update(storyRef, { visibility: "public" });

    const baseDoc = {
      storyId,
      uid,
      summary: story.summary || "",
      excerpt: (story.story || "").slice(0, 320),
      audioUrl: story.audioUrl || null,
      audioPath: story.audioPath || null,
      status: "active",
      likesCount: admin.firestore.FieldValue.increment(0),
      commentsCount: admin.firestore.FieldValue.increment(0),
      createdAt: story.createdAt || Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Merge keeps existing counts if it already exists
    t.set(pubRef, baseDoc, { merge: true });
  });

  // Award badge
  try {
    await awardBadge.run({ auth: { uid }, data: { badgeId: "first_share" } });
  } catch (e) {
    logger.warn("Failed to award badge:", e && e.message ? e.message : String(e));
  }

  logger.info("Story shared to community", { storyId, uid });
  return { ok: true, storyId };
});

// Unshare a story/Remove from community and set private
exports.unshareStory = onCall({}, async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Login required.");
  }
  const uid = request.auth.uid;
  const storyId = String(((request.data && request.data.storyId) || "")).trim();
  if (!storyId) throw new HttpsError("invalid-argument", "Provide storyId.");

  const storyRef = admin.firestore().collection("stories").doc(storyId);
  const storySnap = await storyRef.get();
  if (!storySnap.exists) throw new HttpsError("not-found", "Story not found.");
  const story = storySnap.data() || {};
  if (story.uid !== uid) throw new HttpsError("permission-denied", "Not your story.");

  const pubRef = admin.firestore().collection("community_stories").doc(storyId);

  await admin.firestore().runTransaction(async (t) => {
    t.update(storyRef, { visibility: "private" });
    t.set(
      pubRef,
      {
        status: "removed",
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  });

  logger.info("Story unshared from community", { storyId, uid });
  return { ok: true, storyId };
});
