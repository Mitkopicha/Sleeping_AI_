// test/grantCredits.integration.test.js
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

describe("grantCredits onCall (integration test)", () => {
  it("should grant credits to targetUid 'anon'", async () => {
    const callable = firebase.functions().httpsCallable("grantCredits");

    const requestData = {
      targetUid: "anon",
      amount: 100,
    };

    const result = await callable(requestData); // <- fix here
    const data = result.data;   
    
    // Validate response
    expect(data).toHaveProperty("ok", true);
    expect(data).toHaveProperty("targetUid", "anon");
    expect(data).toHaveProperty("amount", 100);
    expect(data).toHaveProperty("credits");
    expect(typeof data.credits).toBe("number");
    expect(data.credits).toBeGreaterThanOrEqual(100);
  });

  it("should throw an error if targetUid is missing", async () => {
    const callable = firebase.functions().httpsCallable("grantCredits");

    await expect(
      callable({ data: { amount: 100 } })
    ).rejects.toThrow();
  });

  it("should throw an error if amount is invalid", async () => {
    const callable = firebase.functions().httpsCallable("grantCredits");

    await expect(
      callable({ data: { targetUid: "anon", amount: -5 } })
    ).rejects.toThrow();

    await expect(
      callable({ data: { targetUid: "anon", amount: 0 } })
    ).rejects.toThrow();
  });
});
