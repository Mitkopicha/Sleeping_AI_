// Functions (Firebase v2 API)  
const { admin } = require("../core/bootstrap");

// V2 imports 
const { onCall } = require("firebase-functions/v2/https");

// List latest public stories
exports.listPublicStories = onCall({}, async (request) => {
  const limit = Math.min(Number((request.data && request.data.limit) || 12), 50);

  const snap = await admin.firestore()
    .collection("stories")
    .where("visibility", "==", "public")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return { items };
});
