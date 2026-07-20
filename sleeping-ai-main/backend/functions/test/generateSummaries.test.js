// test/generateSummaries.integration.test.js
const firebase = require("firebase/compat/app");
require("firebase/compat/functions");

jest.setTimeout(200000); // 200 seconds


// Initialize Firebase app for emulator
if (!firebase.apps.length) {
  firebase.initializeApp({
    projectId: "bed-stories-bff80", // your project ID
  });
}

// Point functions to local emulator
firebase.functions().useFunctionsEmulator("http://localhost:5003");

describe("generateSummaries onCall (integration test)", () => {
  it("should generate 3–5 summaries for a valid topic", async () => {
    const callable = firebase.functions().httpsCallable("generateSummaries");
    const topic = "dragons";
    
    const result = await callable({ topic });
    console.log(result.data);
    const summaries = result.data.summaries;

    expect(Array.isArray(summaries)).toBe(true);
    expect(summaries.length).toBeGreaterThanOrEqual(3);
    expect(summaries.length).toBeLessThanOrEqual(5);

    summaries.forEach((summary) => {
      expect(typeof summary).toBe("string");
      expect(summary.length).toBeGreaterThan(5); // not empty
    });
  });

  it("should throw an error if topic is missing", async () => {
    const callable = firebase.functions().httpsCallable("generateSummaries");
    await expect(callable({})).rejects.toThrow();
  });

  it("should work for an authenticated user", async () => {
    const callable = firebase.functions().httpsCallable("generateSummaries");

    // In emulator, this will use anonymous auth unless you sign in a test user
    const result = await callable({ topic: "space" });
    const summaries = result.data.summaries;

    expect(Array.isArray(summaries)).toBe(true);
    expect(summaries[0].toLowerCase()).toContain("space");
  });
});
