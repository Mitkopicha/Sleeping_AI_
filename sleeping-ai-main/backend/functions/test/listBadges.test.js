// test/listBadges.integration.test.js
const firebase = require("firebase/compat/app");
require("firebase/compat/functions");

jest.setTimeout(120000); // 2 minutes

// Initialize Firebase app for emulator
if (!firebase.apps.length) {
  firebase.initializeApp({
    projectId: "bed-stories-bff80",
  });
}

// Connect to local Functions emulator
firebase.functions().useFunctionsEmulator("http://localhost:5003");

describe("listBadges onCall (integration test)", () => {
  const testUid = "test-user";

  it("should return a list of badges for authenticated user", async () => {
    const callable = firebase.functions().httpsCallable("listBadges");

    // Simulate auth context
    const context = { auth: { uid: testUid } };

    const result = await callable({}, context); // no data needed
    const data = result.data;

    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);

    // Optionally, check structure of first badge if it exists
    if (data.items.length > 0) {
      const badge = data.items[0];
      expect(badge).toHaveProperty("id");
      expect(typeof badge.id).toBe("string");
    }
  });

  it("should throw an error if user is unauthenticated", async () => {
    const callable = firebase.functions().httpsCallable("listBadges");

    await expect(callable({})).rejects.toThrow("Login required");
  });
});
