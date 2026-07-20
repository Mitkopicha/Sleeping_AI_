// Community feed/comments/moderation
const { admin, logger } = require("../core/bootstrap");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { ensureAllowed } = require("../helpers/guard");
const { Timestamp } = require("firebase-admin/firestore");

// List active community stories
exports.listCommunity = onCall({}, async (request) => {
  const data = (request && request.data) || {};
  const limit = Math.min(Number(data.limit || 12), 50);
  const cursor = String(data.startAfter || "").trim();

  // Build query for community_stories collection
  let q = admin
    .firestore()
    .collection("community_stories")
    .where("status", "==", "active")
    .orderBy("createdAt", "desc")
    .limit(limit);

  if (cursor) {
    const curSnap = await admin.firestore().collection("community_stories").doc(cursor).get();
    if (curSnap.exists) q = q.startAfter(curSnap);
  }

  // Execute query and map results
  const snap = await q.get();
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1].id : null;

  return { items, nextCursor };
});

// Add a new comment to a community story
exports.addComment = onCall({}, async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Login required.");
  }
  const uid = request.auth.uid;

  // Validate input fields
  const data = (request && request.data) || {};
  const storyId = String(data.storyId || "").trim();
  const text = String(data.text || "").trim();

  if (!storyId) throw new HttpsError("invalid-argument", "Provide storyId.");
  if (!text) throw new HttpsError("invalid-argument", "Comment text is required.");
  if (text.length > 800) throw new HttpsError("invalid-argument", "Comment too long.");

  // Apply rate limits on comments
  await ensureAllowed(uid, "comment_story", { perMinute: 12, perHour: 120, perDay: 600 });

  const pubRef = admin.firestore().collection("community_stories").doc(storyId);
  const commentsCol = pubRef.collection("story_comments");

  // Create new comment doc with auto ID
  const commentRef = commentsCol.doc();
  await admin.firestore().runTransaction(async (t) => {
    const pubSnap = await t.get(pubRef);
    if (!pubSnap.exists) throw new HttpsError("not-found", "Community story not found.");

    // Write comment 
    t.set(commentRef, {
      id: commentRef.id,
      storyId,
      uid,
      text,
      status: "active",
      createdAt: Timestamp.now(),
    });
    t.update(pubRef, { commentsCount: admin.firestore.FieldValue.increment(1) });
  });

  logger.info("Comment added", { storyId, uid, commentId: commentRef.id });
  return { ok: true, commentId: commentRef.id };
});

// List active comments for a given story
exports.listComments = onCall({}, async (request) => {
  const data = (request && request.data) || {};
  const storyId = String(data.storyId || "").trim();
  if (!storyId) throw new HttpsError("invalid-argument", "Provide storyId.");

  const limit = Math.min(Number(data.limit || 20), 100);
  const startAfterTs = data.startAfterCreatedAt || null;

  // Query active comments sorted by newest first
  let q = admin
    .firestore()
    .collection("community_stories")
    .doc(storyId)
    .collection("story_comments")
    .where("status", "==", "active")
    .orderBy("createdAt", "desc")
    .limit(limit);

  if (startAfterTs) {
    const ts = admin.firestore.Timestamp.fromMillis(Number(startAfterTs));
    q = q.startAfter(ts);
  }

  // Fetch and return comment list
  const snap = await q.get();
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return { items };
});

// Remove a comment by author/admmin
exports.removeComment = onCall({}, async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Login required.");
  }
  const actor = request.auth.uid;

  // Validate inputs
  const data = (request && request.data) || {};
  const storyId = String(data.storyId || "").trim();
  const commentId = String(data.commentId || "").trim();
  if (!storyId || !commentId) {
    throw new HttpsError("invalid-argument", "Provide storyId & commentId.");
  }

  const pubRef = admin.firestore().collection("community_stories").doc(storyId);
  const commentRef = pubRef.collection("story_comments").doc(commentId);

  await admin.firestore().runTransaction(async (t) => {
    // Ensure comment exists
    const commentSnap = await t.get(commentRef);
    if (!commentSnap.exists) throw new HttpsError("not-found", "Comment not found.");
    const comment = commentSnap.data() || {};

    // Check permissions 
    const adminDocRef = admin.firestore().collection("users").doc(actor);
    const adminSnap = await t.get(adminDocRef);
    const adminData = adminSnap.exists ? (adminSnap.data() || {}) : {};
    const isAdmin = adminData.role === "admin";

    if (comment.uid !== actor && !isAdmin) {
      throw new HttpsError("permission-denied", "You can only remove your own comment.");
    }

    // Hide the comment and reduce the count
    if (comment.status === "removed") return;
    t.update(commentRef, {
      status: "removed",
      removedAt: Timestamp.now(),
      removedBy: actor,
    });
    t.update(pubRef, { commentsCount: admin.firestore.FieldValue.increment(-1) });
  });

  logger.info("Comment removed", { storyId, commentId, by: actor });
  return { ok: true };
});

// Admin can hide, show, or remove a story
exports.moderateStory = onCall({}, async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Login required.");
  }
  const adminUid = request.auth.uid;

  // Validate inputs
  const data = (request && request.data) || {};
  const storyId = String(data.storyId || "").trim();
  const status = String(data.status || "").trim();

  if (!storyId) throw new HttpsError("invalid-argument", "Provide storyId.");
  if (["active", "hidden", "removed"].indexOf(status) === -1) {
    throw new HttpsError("invalid-argument", "Invalid status.");
  }

  // Ensure actor(current user/author etc) has admin role
  const adminDoc = await admin.firestore().collection("users").doc(adminUid).get();
  const adminInfo = adminDoc.exists ? (adminDoc.data() || {}) : {};
  if (adminInfo.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin role required.");
  }

  // Update story status with moderation info
  await admin.firestore().collection("community_stories").doc(storyId).set(
    {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      moderatedBy: adminUid,
    },
    { merge: true }
  );

  logger.info("Story moderated", { storyId, status, by: adminUid });
  return { ok: true };
});


