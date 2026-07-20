/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();
// exports.generateSummaries = functions.https.onCall(async (data, ctx) => {
//     const topic = (data && data.topic) || "Philosophy";
//     return { ok: true, topic, summaries: ["Point A", "Point B", "Point C"] };
//   });


exports.generateSummaries = require('./modules/generator').generateSummaries;
exports.generateStoryAndAudio = require('./modules/generator').generateStoryAndAudio;
exports.listVoices = require('./modules/generator').listVoices; 
exports.grantCredits = require('./modules/admin').grantCredits;
exports.awardBadge = require('./modules/badges').awardBadge;
exports.listBadges = require('./modules/badges').listBadges;
exports.createCheckoutSession = require('./modules/checkout').createCheckoutSession;
exports.listCommunity = require('./modules/community').listCommunity;
exports.addComment = require('./modules/community').addComment;
exports.listComments = require('./modules/community').listComments;
exports.removeComment = require('./modules/community').removeComment;
exports.moderateStory = require('./modules/community').moderateStory;
exports.listPublicStories = require('./modules/feed').listPublicStories; 
exports.likeStory = require('./modules/likeStory').likeStory;
exports.redeemPromoCode = require('./modules/promoCodes').redeemPromoCode;
exports.getUserSettings = require('./modules/settings').getUserSettings;
exports.setUserSettings = require('./modules/settings').setUserSettings;
exports.shareStory = require('./modules/shareStory').shareStory;
exports.unshareStory = require('./modules/shareStory').unshareStory;
exports.listMyStories = require('./modules/stories').listMyStories;
exports.setStoryVisibility = require('./modules/stories').setStoryVisibility; 
exports.deleteStory = require('./modules/stories').deleteStory; 
exports.stripeWebhook = require('./modules/webhook').stripeWebhook
// exports.purchaseCredits = require('./modules/purchaseCredits').purchaseCredits;
// exports.confirmPurchase = require('./modules/confirmPurchase').confirmPurchase;
// exports.shareStory = require('./modules/shareStory').shareStory;
// exports.likeStory = require('./modules/likeStory').likeStory;
// exports.onAuthCreate = require('./triggers/onAuthCreate').onAuthCreate;

setGlobalOptions({ maxInstances: 10 });

