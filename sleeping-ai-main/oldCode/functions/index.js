// index.js
process.env.GOOGLE_APPLICATION_CREDENTIALS = './service-account.json';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const OpenAI = require("openai");
const textToSpeech = require('@google-cloud/text-to-speech');
require("dotenv").config(); // Load .env file

admin.initializeApp();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

//const openai = new OpenAIApi(
//  new Configuration({
//    apiKey: functions.config().openai.key,
//  })
//);

const ttsClient = new textToSpeech.TextToSpeechClient();

exports.generateSummaries = functions.https.onCall(async (data, context) => {
  try {
    const topic = data.topic;
    if (!topic) {
      throw new functions.https.HttpsError('invalid-argument', 'Topic is required');
    }

    const prompt = `Give 3 short bedtime story summaries about "${topic}" for adults.`;
    //const response = "all yours" 
    await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
    });

    const summaries = response //.data.choices[0].message.content.split('\n\n');
    functions.logger.info('Summaries generated successfully');
    return { summaries };
  } catch (error) {
    functions.logger.error('Error in generateSummaries:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate summaries.');
  }
});

exports.generateStoryAndAudio = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { uid } = context.auth;
    const { selectedSummary } = data;

    if (!selectedSummary) {
      throw new functions.https.HttpsError('invalid-argument', 'Summary is required.');
    }

    const userRef = admin.firestore().collection('users').doc(uid);

    await admin.firestore().runTransaction(async (t) => {
      const userSnap = await t.get(userRef);
      const credits = userSnap.data()?.credits || 0;

      if (credits < 1) {
        throw new functions.https.HttpsError('failed-precondition', 'Not enough credits.');
      }

      t.update(userRef, { credits: credits - 1 });
    });

    const storyPrompt = `Expand this summary into a full, calming bedtime story for adults:\n"${selectedSummary}"`;
    const storyResponse = "Much longer story"
    await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: storyPrompt }],
      max_tokens: 1000,
    });

    //const story = storyResponse 
    const story = storyResponse.data.choices[0].message.content;

    const [ttsResponse] = await ttsClient.synthesizeSpeech({
      input: { text: story },
      voice: { languageCode: 'en-GB', ssmlGender: 'FEMALE' },
      audioConfig: { audioEncoding: 'MP3' },
    });

    const fileName = `stories/${uid}/${Date.now()}.mp3`;
    const bucket = admin.storage().bucket();
    const file = bucket.file(fileName);
    await file.save(ttsResponse.audioContent, { contentType: 'audio/mpeg' });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2030',
    });

    // ✅ Store story + audio info in Firestore
    const storyData = {
      uid: uid,
      summary: selectedSummary,
      story: story,
      audioUrl: url,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await admin.firestore().collection('stories').add(storyData);

    functions.logger.info(`Story and audio saved for user ${uid}`);
    return { story, audioUrl: url };
  } catch (error) {
    functions.logger.error('Error in generateStoryAndAudio:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate story and audio.');
  }
});
