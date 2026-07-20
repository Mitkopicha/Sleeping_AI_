
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
 apiKey: "AIzaSyA6xIYriLy0vBwhDjOoktWlQQqhzNHtfLE",
  authDomain: "bed-stories-bff80.firebaseapp.com",
  databaseURL: "https://bed-stories-bff80-default-rtdb.firebaseio.com",
  projectId: "bed-stories-bff80",
  storageBucket: "bed-stories-bff80.firebasestorage.app",
  messagingSenderId: "625912583218",
  appId: "1:625912583218:web:0fc9ef2b047c3740ce182b",
  measurementId: "G-2S8DVWS87N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


// functions start from here 
const functions = require("firebase-functions"); const admin = require("firebase-admin"); const { Configuration, OpenAIApi } = require("openai");
admin.initializeApp();
const openai = new OpenAIApi(new Configuration({   apiKey: functions.config().openai.key
}));
exports.generateSummaries = functions   .region('us-central1')
.https.onCall(async (data, context) => {   const topic = data.topic;   const prompt = `Give 3 short bedtime story summaries about "${topic}" for adults.`;
  const response = await openai.createChatCompletion({     model: "gpt-4",     messages: [{ role: "user", content: prompt }],     max_tokens: 400,
  });
  return { summaries: response.data.choices[0].message.content.split("\n\n") };
});

const textToSpeech = require("@google-cloud/text-to-speech"); const fs = require("fs"); const path = require("path"); const client = new textToSpeech.TextToSpeechClient();
exports.generateStoryAndAudio = functions.https.onCall(async (data, context) => {   const { uid } = context.auth;   const { selectedSummary } = data;
  const userRef = admin.firestore().collection("users").doc(uid);   await admin.firestore().runTransaction(async (t) => {     const userSnap = await t.get(userRef);     const credits = userSnap.data().credits || 0;     if (credits < 1) throw new functions.https.HttpsError("failed-precondition", "Not enough credits.");     t.update(userRef, { credits: credits - 1 });
  });
  const storyPrompt = `Expand this summary into a full, calming bedtime story for adults:\n"${selectedSummary}"`;   const storyResponse = await openai.createChatCompletion({     model: "gpt-4",     messages: [{ role: "user", content: storyPrompt }],     max_tokens: 1000
  });
  const story = storyResponse.data.choices[0].message.content;
  const [ttsResponse] = await client.synthesizeSpeech({     input: { text: story },
    voice: { languageCode: "en-GB", ssmlGender: "FEMALE" },     audioConfig: { audioEncoding: "MP3" },
  });
  const fileName = `stories/${uid}/${Date.now()}.mp3`;   const bucket = admin.storage().bucket();   const file = bucket.file(fileName);   await file.save(ttsResponse.audioContent, { contentType: "audio/mpeg" });
  const [url] = await file.getSignedUrl({ action: "read", expires: "03-01-2030" });
  return { story, audioUrl: url };
});

export function validateSleepLog(log) {
  return log.hours >= 0 && log.hours <= 12 && log.mood.length > 0;
}

