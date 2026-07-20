// Badges award
const { Timestamp } = require("firebase-admin/firestore");
const { admin, logger } = require("../core/bootstrap");

// V2 imports 
const { onCall, HttpsError } = require("firebase-functions/v2/https");

// Minimal catalog
const BADGE_CATALOG = {
  first_share: { id: "first_share", label: "First Share", kind: "milestone" },
  storyteller: { id: "storyteller", label: "Storyteller", kind: "milestone" },
  community_helper: { id: "community_helper", label: "Community Helper", kind: "community" },
};

// Award a badge to the current user 
exports.awardBadge = onCall({}, async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Login required.");
  }
  const uid = request.auth.uid;
  const badgeId = String(((request.data && request.data.badgeId) || "")).trim();
  if (!badgeId) throw new HttpsError("invalid-argument", "Provide badgeId.");

  const badgeMeta = BADGE_CATALOG[badgeId] || { id: badgeId, label: badgeId, kind: "custom" };
  const ref = admin.firestore().collection("users").doc(uid).collection("badges").doc(badgeId);

  await ref.set(
    {
      id: badgeMeta.id,
      label: badgeMeta.label,
      kind: badgeMeta.kind,
      awardedAt: Timestamp.now(),
    },
    { merge: true }
  );

  try {
    await admin.firestore().collection("analytics").add({
      uid,
      type: "award_badge",
      data: { badgeId },
      ts: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    logger.warn("awardBadge analytics failed:", e);
  }

  logger.info("Badge awarded", { uid, badgeId });
  return { ok: true, badgeId };
});

// List my badges
exports.listBadges = onCall({}, async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Login required.");
  }
  const uid = request.auth.uid;
  const snap = await admin.firestore().collection("users").doc(uid).collection("badges").get();
  const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
  return { items };
});
