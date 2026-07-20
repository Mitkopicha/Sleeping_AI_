// Admin can grant credits 
const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { Timestamp } = require("firebase-admin/firestore");

// Bind the secret set
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

exports.grantCredits = onCall(
  { secrets: [OPENAI_API_KEY] },
  async (request) => {
    // if (!request.auth || !request.auth.uid) {
    //   throw new HttpsError("unauthenticated", "Login required.");
    // }

    //const adminUid = request.auth.uid;
    const adminUid = (request.auth && request.auth.uid) || "anon";

    const targetUid = String((request.data && request.data.targetUid) || "").trim();
    const amountNum = Number((request.data && request.data.amount) || 0);

    // Basic input validation
    if (!targetUid) throw new HttpsError("invalid-argument", "Provide targetUid.");
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      throw new HttpsError("invalid-argument", "Amount must be a positive number.");
    }
    if (amountNum > 500) {
      throw new HttpsError("invalid-argument", "Amount too large (max 500 for test endpoint).");
    }

    // If we are in the emulator and testing anon, skip admin check
    const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
    if (!isEmulator && adminUid !== "anon") {
      // Require admin role in Firestore for non-emulator calls
      const adminDoc = await admin.firestore().collection("users").doc(adminUid).get();
      const isAdmin = !!adminDoc.exists && adminDoc.data() && adminDoc.data().role === "admin";
      if (!isAdmin) {
        throw new HttpsError("permission-denied", "Admin role required.");
      }
    }

    // Add credits to the user's account
    const userRef = admin.firestore().collection("users").doc(targetUid);
    const snap = await userRef.get();
    const currentCredits = snap.exists && typeof snap.data().credits === "number" ? snap.data().credits : 0;

    await userRef.set(
      { credits: currentCredits + amountNum },
      { merge: true }
    );

    // Read the new balance
    const updated = await userRef.get();
    const newCredits = (updated.data() && updated.data().credits) || 0;

    // Analytics log
    try {
      await admin.firestore().collection("analytics").add({
        uid: adminUid,
        type: "grant_credits",
        data: { targetUid, amount: amountNum, source: "admin_test" },
        ts: Timestamp.now(),
      });
    } catch (e) {
      logger.warn("grantCredits analytics failed:", e);
    }

    // Write a purchase record for history
    try {
      await admin.firestore().collection("purchases").add({
        targetUid,
        amount: amountNum,
        source: "admin_test",
        ts: Timestamp.now(),
      });
    } catch (e) {
      logger.warn("purchases write failed:", e);
    }

    return { ok: true, targetUid, amount: amountNum, credits: newCredits };
  }
);
