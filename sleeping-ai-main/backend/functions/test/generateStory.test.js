// test/generateStoryAndAudio.integration.test.js
const firebase = require("firebase/compat/app");
require("firebase/compat/functions");

jest.setTimeout(300000); // 5 minutes for long-running OpenAI calls

// Initialize Firebase app for emulator
if (!firebase.apps.length) {
  firebase.initializeApp({
    projectId: "bed-stories-bff80",
  });
}

// Connect to local Functions emulator
firebase.functions().useFunctionsEmulator("http://localhost:5003");

describe("generateStoryAndAudio onCall (integration test)", () => {
  it("should generate a story and audio URL from a selected summary", async () => {
    const callable = firebase.functions().httpsCallable("generateStoryAndAudio");

    const requestData = {
      Summary: "Dinosaurs ruled the Earth, and they were very friendly to humans.",
      minutes: 10,
      voice: "FEMALE",
      voiceId: "",
      rate: 1.0,
      musicTrack: "",
      musicVolume: 0.25,
    };

    const result = await callable({ requestData });
    const data = result.data;

    // Validate response
    expect(data).toHaveProperty("story");
    expect(typeof data.story).toBe("string");
    expect(data.story.length).toBeGreaterThan(50); // story should not be empty

    expect(data).toHaveProperty("audioUrl");
    expect(typeof data.audioUrl).toBe("string");
    expect(data.audioUrl).toContain(".mp3"); // basic check for mp3 URL
  });

  it("should throw an error if selectedSummary is missing", async () => {
    const callable = firebase.functions().httpsCallable("generateStoryAndAudio");

    await expect(
      callable({ data: { minutes: 10 } })
    ).rejects.toThrow();
  });
});
