// test/listPublicStories.integration.test.js
const firebase = require("firebase/compat/app");
require("firebase/compat/functions");
require("firebase/compat/firestore");

jest.setTimeout(120000); // 2 minutes

// Initialize Firebase app for emulator
if (!firebase.apps.length) {
  firebase.initializeApp({
    projectId: "bed-stories-bff80",
  });
}

// Connect to local Functions emulator
firebase.functions().useFunctionsEmulator("http://localhost:5003");
const firestore = firebase.firestore();
firestore.useEmulator("localhost", 8080); // Firestore emulator port

describe("listPublicStories onCall (integration test)", () => {
  const testStories = [
    { title: "Public Story A", visibility: "public", createdAt: new Date() },
    { title: "Public Story B", visibility: "public", createdAt: new Date(Date.now() - 1000) },
    { title: "Private Story C", visibility: "private", createdAt: new Date(Date.now() - 2000) },
  ];

  beforeAll(async () => {
    // Seed test data in the emulator
    const batch = firestore.batch();
    testStories.forEach((story, idx) => {
      const docRef = firestore.collection("stories").doc(`story-${idx}`);
      batch.set(docRef, story);
    });
    await batch.commit();
  });

  it("should return only public stories", async () => {
    const callable = firebase.functions().httpsCallable("listPublicStories");

    const result = await callable({ limit: 5 });
    const data = result.data;

    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);

    data.items.forEach((item) => {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("title");
      expect(item.visibility).toBe("public");
    });
  });

  it("should respect the limit parameter", async () => {
    const callable = firebase.functions().httpsCallable("listPublicStories");

    const result = await callable({ limit: 1 });
    const data = result.data;

    expect(data.items.length).toBeLessThanOrEqual(1);
  });
});
