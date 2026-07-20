// Load Firebase Admin SDK and project logger  
const { admin, logger } = require("../core/bootstrap");

// V2 imports 
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { Timestamp } = require("firebase-admin/firestore");

// Bind the secret set from firebase functions:secrets:set OPENAI_API_KEY
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

// Library APIs
// List my stories
exports.listMyStories = onCall(
  { secrets: [OPENAI_API_KEY] },
  async (request) => {
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError("unauthenticated", "Login required.");
    }
    const uid = request.auth.uid;
    const limit = Math.min(Number(((request.data && request.data.limit) || 10)), 50);
    const cursor = (request.data && request.data.startAfter) || null;

    let q = admin.firestore()
      .collection("stories")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (cursor) {
      const snap = await admin.firestore().collection("stories").doc(cursor).get();
      if (snap.exists) q = q.startAfter(snap);
    }

    const res = await q.get();
    const items = res.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
    const nextCursor = res.docs.length ? res.docs[res.docs.length - 1].id : null;

    return { items, nextCursor };
  }
);

// Toggle visibility private/public
exports.setStoryVisibility = onCall(
  { secrets: [OPENAI_API_KEY] },
  async (request) => {
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError("unauthenticated", "Login required.");
    }
    const uid = request.auth.uid;
    const storyId = String(((request.data && request.data.storyId) || "")).trim();
    const visibility = String(((request.data && request.data.visibility) || "")).trim(); // "private" | "public"

    if (!storyId || (visibility !== "private" && visibility !== "public")) {
      throw new HttpsError("invalid-argument", "Provide storyId and visibility ('private'|'public').");
    }

    const ref = admin.firestore().collection("stories").doc(storyId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError("not-found", "Story not found.");
    const data = snap.data() || {};
    if (data.uid !== uid) {
      throw new HttpsError("permission-denied", "Not your story.");
    }

    await ref.update({ visibility });

    // Analytics
    try {
      await admin.firestore().collection("analytics").add({
        uid,
        type: "set_visibility",
        data: { storyId, visibility },
        ts: Timestamp.now(),
      });
    } catch (e) {
      logger.warn("Analytics logging failed:", e);
    }

    return { ok: true };
  }
);

// Delete a story (doc + audio file)
exports.deleteStory = onCall(
  { secrets: [OPENAI_API_KEY] },
  async (request) => {
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError("unauthenticated", "Login required.");
    }
    const uid = request.auth.uid;
    const storyId = String(((request.data && request.data.storyId) || "")).trim();
    if (!storyId) throw new HttpsError("invalid-argument", "Provide storyId.");

    const ref = admin.firestore().collection("stories").doc(storyId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError("not-found", "Story not found.");
    const data = snap.data() || {};
    if (data.uid !== uid) {
      throw new HttpsError("permission-denied", "Not your story.");
    }

    // Delete audio if present
    const audioPath = data.audioPath;
    if (audioPath) {
      const bucket = admin.storage().bucket();
      await bucket.file(String(audioPath)).delete({ ignoreNotFound: true });
    }
    await ref.delete();

    // Analytics
    try {
      await admin.firestore().collection("analytics").add({
        uid,
        type: "delete_story",
        data: { storyId },
        ts: Timestamp.now(),
      });
    } catch (e) {
      logger.warn("Analytics logging failed:", e);
    }

    return { ok: true };
  }
);


