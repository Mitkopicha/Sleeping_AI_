// Functions (Firebase v2 API)  
const { admin } = require("../core/bootstrap");

// V2 imports 
const { onCall, HttpsError } = require("firebase-functions/v2/https");

// Get/Set user preferences
exports.getUserSettings = onCall({}, async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Login required.");
  }
  const uid = request.auth.uid;
  const ref = admin.firestore().collection("settings").doc(uid);
  const snap = await ref.get();
  return { settings: snap.exists ? snap.data() : {} };
});

exports.setUserSettings = onCall({}, async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Login required.");
  }
  const uid = request.auth.uid;
  const settings = (request.data && request.data.settings) || {};
  await admin.firestore().collection("settings").doc(uid).set(settings, { merge: true });
  return { ok: true };
});
