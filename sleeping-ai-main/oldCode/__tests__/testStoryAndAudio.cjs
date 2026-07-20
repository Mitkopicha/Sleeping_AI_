const { getFunctions, connectFunctionsEmulator, httpsCallable } = require('firebase/functions');
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');

const app = initializeApp({
    apiKey: "AIzaSyA6xIYriLy0vBwhDjOoktWlQQqhzNHtfLE",
    authDomain: "bed-stories-bff80.firebaseapp.com",
    projectId: "bed-stories-bff80",
    appId: "1:625912583218:web:0fc9ef2b047c3740ce182b"
});

const functions = getFunctions(app);
connectFunctionsEmulator(functions, "localhost", 5001);

(async () => {
  const generateStoryAndAudio = httpsCallable(functions, 'generateStoryAndAudio');

  const data = {
    selectedSummary: "A lonely astronomer finds peace in stargazing every night..."
  };

  // This part mocks an authenticated user call — you would normally test this in the Firebase Emulator Suite or with a Firebase Auth token
  const context = {
    auth: { uid: 'test-user-123' }
  };

  const result = await generateStoryAndAudio(data, context);  // you might need to test this from frontend emulator
  console.log(result.data);
})();
