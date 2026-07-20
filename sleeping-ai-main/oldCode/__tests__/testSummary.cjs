const { initializeApp } = require('firebase/app');
const { getFunctions, connectFunctionsEmulator, httpsCallable } = require('firebase/functions');

const app = initializeApp({
  apiKey: "fake-key",
  authDomain: "fake.firebaseapp.com",
  projectId: "bedtime-stories-2509a",
});

//const app = initializeApp({
//    apiKey: "AIzaSyA6xIYriLy0vBwhDjOoktWlQQqhzNHtfLE",
//    authDomain: "bed-stories-bff80.firebaseapp.com",
//    projectId: "bed-stories-bff80",
//    appId: "1:625912583218:web:0fc9ef2b047c3740ce182b"
//});
const functions = getFunctions(app);
connectFunctionsEmulator(functions, 'localhost', 5001);

(async () => {
  const generateSummaries = httpsCallable(functions, 'us-central1-generateSummaries');
  const result = await generateSummaries({ topic: 'ocean dreams' });
  console.log(result.data);
})();