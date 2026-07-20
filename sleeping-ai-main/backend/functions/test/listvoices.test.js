// test/listVoices.integration.test.js
const firebase = require("firebase/compat/app");
require("firebase/compat/functions");

jest.setTimeout(60000); // 1 minute

// Initialize Firebase app for emulator
if (!firebase.apps.length) {
  firebase.initializeApp({
    projectId: "bed-stories-bff80",
  });
}

// Connect to local Functions emulator
firebase.functions().useFunctionsEmulator("http://localhost:5003");

describe("listVoices onCall (integration test)", () => {
  it("should return a list of voices", async () => {
    const callable = firebase.functions().httpsCallable("listVoices");

    const result = await callable(); // no data needed
    const data = result.data;

    expect(data).toHaveProperty("voices");
    expect(Array.isArray(data.voices)).toBe(true);
    expect(data.voices.length).toBeGreaterThan(0);

    // Optional: check the first voice has expected structure
    const voice = data.voices[0];
    expect(voice).toHaveProperty("id");
    expect(voice).toHaveProperty("name");
    expect(typeof voice.id).toBe("string");
    expect(typeof voice.name).toBe("string");
  });

  it("should return consistent voices array", async () => {
    const callable = firebase.functions().httpsCallable("listVoices");

    const result1 = await callable();
    const result2 = await callable();

    expect(result1.data.voices).toEqual(result2.data.voices);
  });
});
