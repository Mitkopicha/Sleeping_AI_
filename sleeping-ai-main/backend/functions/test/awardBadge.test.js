// test/awardBadge.integration.test.js
const firebase = require("firebase/compat/app");
require("firebase/compat/functions");

jest.setTimeout(120000); // 2 minutes for Firestore writes

// Initialize Firebase app for emulator
if (!firebase.apps.length) {
  firebase.initializeApp({
    projectId: "bed-stories-bff80",
  });
}

// Connect to local Functions emulator
firebase.functions().useFunctionsEmulator("http://localhost:5003");

describe("awardBadge onCall (integration test)", () => {
  const testUid = "test-user";
  const testBadgeId = "friendly-dino";

  it("should award a badge to an authenticated user", async () => {
    const callable = firebase.functions().httpsCallable("awardBadge");

    // Simulate auth context in the emulator
    const context = { auth: { uid: testUid } };

    // Normally, onCall functions automatically receive auth from the SDK.
    // With emulator, we can pass `auth` manually by wrapping data in a function:
    const result = await callable({ badgeId: testBadgeId }, context);

    const data = result.data;
    expect(data).toHaveProperty("ok", true);
    expect(data).toHaveProperty("badgeId", testBadgeId);
  });

  it("should throw an error if badgeId is missing", async () => {
    const callable = firebase.functions().httpsCallable("awardBadge");

    const context = { auth: { uid: testUid } };

    await expect(callable({}, context)).rejects.toThrow();
  });

  it("should throw an error if user is unauthenticated", async () => {
    const callable = firebase.functions().httpsCallable("awardBadge");

    await expect(callable({ badgeId: testBadgeId })).rejects.toThrow("Login required");
  });
});
