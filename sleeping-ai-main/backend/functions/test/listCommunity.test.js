// test/listCommunity.integration.test.js
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

describe("listCommunity onCall (integration test)", () => {
  const testStories = [
    { title: "Story A", status: "active", createdAt: new Date() },
    { title: "Story B", status: "active", createdAt: new Date(Date.now() - 1000) },
    { title: "Story C", status: "inactive", createdAt: new Date(Date.now() - 2000) },
  ];

  beforeAll(async () => {
    // Seed test data in the emulator
    const batch = firestore.batch();
    testStories.forEach((story, idx) => {
      const docRef = firestore.collection("community_stories").doc(`story-${idx}`);
      batch.set(docRef, story);
    });
    await batch.commit();
  });

  it("should return active community stories with a nextCursor", async () => {
    const callable = firebase.functions().httpsCallable("listCommunity");

    const result = await callable({ limit: 2 });
    const data = result.data;

    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeLessThanOrEqual(2);

    data.items.forEach((item) => {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("title");
      expect(item.status).toBe("active");
    });

    expect(data).toHaveProperty("nextCursor");
    if (data.items.length > 0) {
      expect(data.nextCursor).toBe(data.items[data.items.length - 1].id);
    }
  });

  it("should respect the startAfter cursor", async () => {
    const callable = firebase.functions().httpsCallable("listCommunity");

    // Get first page
    const firstPage = await callable({ limit: 1 });
    const nextCursor = firstPage.data.nextCursor;

    // Get next page using cursor
    const secondPage = await callable({ limit: 1, startAfter: nextCursor });
    const secondItems = secondPage.data.items;

    expect(secondItems[0].id).not.toBe(firstPage.data.items[0].id);
  });
});
