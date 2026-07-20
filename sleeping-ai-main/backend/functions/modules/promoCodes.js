// Import Firebase Admin SDK 
const { Timestamp } = require("firebase-admin/firestore");
const { admin, logger } = require("../core/bootstrap");

// V2 imports 
const { onCall, HttpsError } = require("firebase-functions/v2/https");

// Cloud Function redeem a promo code and grant credits to a user
exports.redeemPromoCode = onCall({}, async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Login required.");
  }
  const uid = request.auth.uid;

 // Get promo code from request
  const raw = String(((request.data && request.data.code) || "")).trim();
  if (!raw) throw new HttpsError("invalid-argument", "Provide promo code.");
  const code = raw.toUpperCase();

  const codeRef = admin.firestore().collection("promo_codes").doc(code);
  const redemptionRef = admin.firestore().collection("promo_redemptions").doc(code + "__" + uid);
  const userRef = admin.firestore().collection("users").doc(uid);
  const purchasesRef = admin.firestore().collection("purchases").doc("promo__" + code + "__" + uid);

  let granted = 0;

 // Run everything inside a Firestore transaction to guarantee consistency
  await admin.firestore().runTransaction(async (t) => {
    const codeSnap = await t.get(codeRef);
    const redemptionSnap = await t.get(redemptionRef);
    if (!codeSnap.exists) throw new HttpsError("not-found", "Invalid code.");

    const data = codeSnap.data() || {};

    if (data.active === false) throw new HttpsError("failed-precondition", "Code is inactive.");
    if (data.expiresAt && data.expiresAt.toMillis && data.expiresAt.toMillis() < Date.now()) {
      throw new HttpsError("failed-precondition", "Code has expired.");
    }
    const credits = Number(data.credits || 0);
    if (!Number.isFinite(credits) || credits <= 0) {
      throw new HttpsError("failed-precondition", "Code misconfigured.");
    }

   // Check usage limits
    const maxUses = Number(data.maxUses || 0) || null;
    const used = Number(data.used || 0);
    if (maxUses && used >= maxUses) throw new HttpsError("resource-exhausted", "Code fully used.");
    if (redemptionSnap.exists) throw new HttpsError("already-exists", "You already redeemed this code.");

   // Record that this user has redeemed the code
    t.set(redemptionRef, {
      code,
      uid,
      redeemedAt: Timestamp.now(),
    });

    // Update the promo code document
    t.set(
      codeRef,
      {
        used: admin.firestore.FieldValue.increment(1),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    // Grant credits
    t.set(
      userRef,
      {
        credits: admin.firestore.FieldValue.increment(credits),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    // Create an audit record of the redemption
    t.set(
      purchasesRef,
      {
        uid,
        source: "promo_code",
        code,
        credits,
        status: "granted",
        createdAt: Timestamp.now(),
      },
      { merge: true }
    );

    granted = credits;
  });

  try {
    await admin.firestore().collection("analytics").add({
      uid,
      type: "redeem_promo",
      data: { code, credits: granted },
      ts: Timestamp.now(),
    });
  } catch (e) {
    logger.warn("Promo analytics failed:", e);
  }

  logger.info("Promo code redeemed", { code, uid, credits: granted });
  return { ok: true, code, credits: granted };
});
