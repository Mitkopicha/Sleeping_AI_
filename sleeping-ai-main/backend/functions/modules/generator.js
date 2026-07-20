// Functions (Firebase v2 API)
const { admin, logger } = require("../core/bootstrap");
const { OpenAI } = require("openai");
const textToSpeech = require("@google-cloud/text-to-speech");
const { Timestamp } = require('firebase-admin/firestore');
// V2 imports
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

// Rate limiter
const { ensureAllowed } = require("../helpers/guard");

// Voice catalog/resolver
const { CATALOG: VOICE_CATALOG, resolveVoice } = require("../helpers/voices");

// Utils
const { sleep, toPlainError, clamp01 } = require("../helpers/utils");

// Ambient mix
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

let ffprobePath = null;
try {
  ffprobePath = require("ffprobe-static").path;
} catch (e) {
  ffprobePath = null;
}

const os = require("os");
const fs = require("fs").promises;
const path = require("path");

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
if (ffprobePath) ffmpeg.setFfprobePath(ffprobePath);

// Set OpenAi secret
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

// Local config
const cfg = {
  openai: { retries: 5, backoffMs: 800, maxRetryAfterSec: 10 },
  speak: { baseWpm: 140, minWords: 200, ttsByteLimit: 4800 },
  storage: { signedUrlExpiry: "2030-03-01" },
};

// TTS payload
function trimToBytes(str, maxBytes) {
  const limit = typeof maxBytes === "number" ? maxBytes : cfg.speak.ttsByteLimit;
  let end = str.length;
  while (Buffer.byteLength(str.slice(0, end), "utf8") > limit) end -= 200;
  while (Buffer.byteLength(str.slice(0, end), "utf8") > limit) end -= 1;
  return str.slice(0, end);
}

// Rough word target based on minutes and speaking rate
function estimateTargetWords(minutes, speakingRate) {
  const mins = typeof minutes === "number" ? minutes : 10;
  const rate = typeof speakingRate === "number" ? speakingRate : 1.0;
  const wpm = cfg.speak.baseWpm * rate;
  const n = Math.round(mins * wpm);
  return n < cfg.speak.minWords ? cfg.speak.minWords : n;
}

// Trim at sentence boundaries close to target words
function trimToTargetWords(text, targetWords, tolerance) {
  if (!text) return text;
  const tol = typeof tolerance === "number" ? tolerance : 0.12;
  const words = text.split(/\s+/);
  const maxWords = Math.round(targetWords * (1 + tol));
  if (words.length <= maxWords) return text;

  const sentences = text.split(/(?<=[.!?])\s+/);
  let count = 0;
  const out = [];
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const wc = s.trim().split(/\s+/).filter(Boolean).length;
    count += wc;
    out.push(s);
    if (count >= targetWords) break;
  }
  const joined = out.join(" ").trim();
  if (joined.length < 80) return words.slice(0, targetWords).join(" ") + "…";
  return joined;
}

// Downloads a file from Google Cloud Storage to the system's temporary directory
async function downloadToTmp(gcsFile) {
  const tmp = path.join(
    os.tmpdir(),
    Date.now() + "_" + Math.random().toString(36).slice(2) + ".mp3"
  );
  await gcsFile.download({ destination: tmp });
  return tmp;
}

// Mix voice/music
async function mixMp3s(voiceLocalPath, musicLocalPath, musicVolume) {
  const vol = clamp01(musicVolume);
  const out = path.join(
    os.tmpdir(),
    "mixed_" + Date.now() + "_" + Math.random().toString(36).slice(2) + ".mp3"
  );

  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(voiceLocalPath)
      .input(musicLocalPath)
      .complexFilter(
        [
          "[1:a]volume=" + vol.toFixed(2) + "[bg]",
          "[0:a][bg]amix=inputs=2:duration=longest:dropout_transition=0," +
            "volume=2[mix]",
        ],
        "mix"
      )
      .outputOptions(["-map", "[mix]", "-c:a", "libmp3lame", "-b:a", "192k"])
      .on("error", (err) => reject(err))
      .on("end", () => resolve())
      .save(out);
  });

  return out;
}

// OpenAI client
// function getOpenAI() {
//   const key = OPENAI_API_KEY.value();
//   if (!key) throw new Error("Missing OPENAI_API_KEY secret");
//   return new OpenAI({ apiKey: key });
// }
function getOpenAI() {
  // Try Firebase Secret Manager first
  let key;
  try {
    if (typeof OPENAI_API_KEY?.value === "function") {
      key = OPENAI_API_KEY.value();
    }
  } catch (_) {
    // ignore if not available
  }

  // Fallback to environment variable
  if (!key) {
    key = process.env.OPENAI_API_KEY;
  }

  if (!key) {
    throw new Error("Missing OPENAI_API_KEY (neither secret nor env var set)");
  }

  return new OpenAI({ apiKey: key });
}


// Analytics
async function logEvent(uid, type, data) {
  const payload = data || {};
  try {
    await admin.firestore().collection("analytics").add({
      uid: uid || null,
      type,
      data: payload,
      ts: Timestamp.now(),
    });
  } catch (err) {
    logger.warn("analytics log failed", { type, err: String(err) });
  }
}

// OpenAI retry
async function retryOpenAI(fn) {
  let last = null;
  for (let i = 0; i <= cfg.openai.retries; i++) {
    try {
      return await fn();
    } catch (e) {
      const info = toPlainError(e);

      if (info.status === 429) {
        let retryAfterSec = null;
        const h = info.headers;
        if (h) {
          if (typeof h.get === "function") {
            retryAfterSec = Number(h.get("retry-after"));
          } else if (h["retry-after"]) {
            retryAfterSec = Number(h["retry-after"]);
          }
        }

        if (i < cfg.openai.retries) {
          if (
            retryAfterSec &&
            retryAfterSec > 0 &&
            retryAfterSec <= cfg.openai.maxRetryAfterSec
          ) {
            await sleep(retryAfterSec * 1000);
          } else {
            const ms = Math.min(5000, cfg.openai.backoffMs * Math.pow(2, i));
            await sleep(ms);
          }
          continue;
        }

        throw new HttpsError(
          "resource-exhausted",
          "The text generator is busy. Try again shortly."
        );
      }

      last = e;
      if (i < cfg.openai.retries) {
        const ms = Math.min(5000, cfg.openai.backoffMs * (i + 1));
        await sleep(ms);
        continue;
      }
    }
  }
  if (last instanceof HttpsError) throw last;
  throw new HttpsError("internal", "OpenAI call failed.");
}

const ttsClient = new textToSpeech.TextToSpeechClient();

// Generate 3 short summaries
exports.generateSummaries = onCall(
  {
    secrets: [OPENAI_API_KEY],
    timeoutSeconds: 120,
    memory: "512Mi",
  },
  async (request) => {
    try {
      const topic = String(
        request.data && request.data.topic ? request.data.topic : ""
      ).trim();
      if (!topic) throw new HttpsError("invalid-argument", "Topic is required.");
      if (topic.length > 120) {
        throw new HttpsError("invalid-argument", "Topic too long.");
      }
      const uid = request.auth && request.auth.uid ? request.auth.uid : "anon";
      await ensureAllowed(uid, "generate_summaries", {
        perMinute: 5,
        perDay: 50,
      });

      const openai = getOpenAI();
      const prompt =
        "Give 3 short bedtime story summaries about \"" +
        topic +
        "\" for adults. Separate each summary with a blank line.";
      console.log(prompt);

      const resp = await retryOpenAI(() =>
        openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 400,
        })
      );

      let text = "";
      if (
        resp &&
        resp.choices &&
        resp.choices[0] &&
        resp.choices[0].message &&
        resp.choices[0].message.content
      ) {
        text = resp.choices[0].message.content;
      }

      const summaries = text
        .split(/\n\s*\n/)
        .map((s) => s.trim())
        .filter((s) => !!s);

      await logEvent(uid, "get_summaries", { topic, count: summaries.length });

      return { summaries };
    } catch (err) {
      logger.error("generateSummaries error", { err: String(err) });
      if (err instanceof HttpsError) throw err;
      throw new HttpsError("internal", "Failed to generate summaries.");
    }
  }
);

// Expand summary into story + TTS
exports.generateStoryAndAudio = onCall(
  {
    secrets: [OPENAI_API_KEY],
    timeoutSeconds: 300,
    memory: "1Gi",
  },
  async (request) => {
    //const uid = request.auth && request.auth.uid ? request.auth.uid : null;
    const uid = request.auth && request.auth.uid ? request.auth.uid : "anon";

    let debited = false;

    try {
      if (!uid) throw new HttpsError("unauthenticated", "User must be logged in.");

      const selectedSummary = String(
        request.data && request.data.selectedSummary ?
          request.data.selectedSummary :
          ""
      ).trim();
      if (!selectedSummary) {
        throw new HttpsError("invalid-argument", "Summary is required.");
      }
      if (selectedSummary.length > 1500) {
        throw new HttpsError("invalid-argument", "Summary too long.");
      }

      const minutes = Number(
        request.data && request.data.minutes ? request.data.minutes : 10
      );
      const voiceGender = String(
        request.data && request.data.voice ? request.data.voice : "FEMALE"
      );
      const voiceId = String(
        request.data && request.data.voiceId ? request.data.voiceId : ""
      ).trim();
      const speakingRate = Number(
        request.data && request.data.rate ? request.data.rate : 1.0
      );

      const musicTrack = String(
        request.data && request.data.musicTrack ? request.data.musicTrack : ""
      ).trim();
      const musicVolumeIn = Number(
        request.data && request.data.musicVolume ? request.data.musicVolume : 0.25
      );
      const musicVolume = clamp01(musicVolumeIn);

      await ensureAllowed(uid, "generate_story", { perMinute: 2, perDay: 20 });

      // Debit 1 credit
      const userRef = admin.firestore().collection("users").doc(uid);
      await admin.firestore().runTransaction(async (t) => {
        const snap = await t.get(userRef);
        const data = snap.exists ? snap.data() : {};
        const credits = data && typeof data.credits === "number" ? data.credits : 0;
        if (credits < 1) {
          throw new HttpsError("failed-precondition", "Not enough credits.");
        }
        t.update(userRef, { credits: credits - 1 });
      });
      debited = true;

      // Story OpenAI
      const openai = getOpenAI();
      const storyPrompt =
        "Expand this summary into a full, calming bedtime story for adults " +
        "(800-1200 words), gentle tone, UK English:\n" +
        "\"" +
        selectedSummary +
        "\"";

      const storyResp = await retryOpenAI(() =>
        openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: storyPrompt }],
          max_tokens: 1200,
        })
      );

      let story = "";
      if (
        storyResp &&
        storyResp.choices &&
        storyResp.choices[0] &&
        storyResp.choices[0].message &&
        storyResp.choices[0].message.content
      ) {
        story = String(storyResp.choices[0].message.content).trim();
      }

      const targetWords = estimateTargetWords(minutes, speakingRate);
      story = trimToTargetWords(story, targetWords);

      const ttsInput = trimToBytes(story);
      const voiceMeta = resolveVoice({ voiceId: voiceId, voiceGender: voiceGender });

      // TTS
      const ttsResponseArr = await ttsClient.synthesizeSpeech({
        input: { text: ttsInput },
        voice: {
          languageCode: voiceMeta.languageCode,
          name: voiceMeta.name,
          ssmlGender: voiceMeta.ssmlGender,
        },
        audioConfig: { audioEncoding: "MP3", speakingRate: speakingRate },
      });
      const ttsResponse = Array.isArray(ttsResponseArr) ?
        ttsResponseArr[0] :
        ttsResponseArr;

      // Save voice MP3
      const bucket = admin.storage().bucket();
      const voicePath = "stories/" + uid + "/" + Date.now() + ".mp3";
      const voiceFile = bucket.file(voicePath);
      await voiceFile.save(ttsResponse.audioContent, { contentType: "audio/mpeg" });

      // Optional mix
      let finalPath = voicePath;
      if (musicTrack) {
        try {
          const musicFile = bucket.file("ambient/" + musicTrack);

          // Debug log
          const [exists] = await musicFile.exists();
          logger.info("ambient check", {
            bucket: bucket.name,
            file: "ambient/" + musicTrack,
            exists,
          });

          if (!exists) {
            logger.info("ambient track not found, using voice only", { musicTrack });
          } else {
            const voiceLocal = await downloadToTmp(voiceFile);
            const musicLocal = await downloadToTmp(musicFile);
            const mixedLocal = await mixMp3s(voiceLocal, musicLocal, musicVolume);

            finalPath = "stories/" + uid + "/" + Date.now() + "_mixed.mp3";
            const mixedFile = bucket.file(finalPath);
            const mixedBuffer = await fs.readFile(mixedLocal);
            await mixedFile.save(mixedBuffer, { contentType: "audio/mpeg" });

            await fs.unlink(voiceLocal).catch((e) => {
              logger.debug("tmp cleanup ignore", String(e));
            });
            await fs.unlink(musicLocal).catch((e) => {
              logger.debug("tmp cleanup ignore", String(e));
            });
            await fs.unlink(mixedLocal).catch((e) => {
              logger.debug("tmp cleanup ignore", String(e));
            });
          }
        } catch (mixErr) {
          logger.info("mix failed, fallback to voice-only", {
            track: musicTrack,
            err: mixErr && mixErr.message ? mixErr.message : String(mixErr),
          });
          finalPath = voicePath;
        }
      }

      // Signed URL
      const signedArr = await bucket.file(finalPath).getSignedUrl({
        action: "read",
        expires: cfg.storage.signedUrlExpiry,
      });
      const finalUrl = Array.isArray(signedArr) ? signedArr[0] : null;

      // Store library doc
      await admin.firestore().collection("stories").add({
        uid: uid,
        summary: selectedSummary,
        story: story,
        audioPath: finalPath,
        audioUrl: finalUrl,
        visibility: "private",
        minutes: minutes,
        voice: voiceMeta.id,
        voiceLabel: voiceMeta.label,
        rate: speakingRate,
        musicTrack: musicTrack || null,
        musicVolume: musicTrack ? musicVolume : null,
        createdAt: Timestamp.now(),
      });

      await logEvent(uid, "generate_story", {
        minutes: minutes,
        voice: voiceMeta.id,
        rate: speakingRate,
        musicTrack: musicTrack || null,
        musicVolume: musicTrack ? musicVolume : null,
      });
      await admin.firestore().collection("stats").doc("global")
        .set({ stories: admin.firestore.FieldValue.increment(1) }, { merge: true });
      await admin.firestore().collection("users").doc(uid)
        .set({ stories: admin.firestore.FieldValue.increment(1) }, { merge: true });

      return { story: story, audioUrl: finalUrl };
    } catch (err) {
      logger.error("generateStoryAndAudio error", { err: String(err) });

      // Refund a single credit on failure
      try {
        if (debited && uid) {
          await admin.firestore().collection("users").doc(uid)
            .set({ credits: admin.firestore.FieldValue.increment(1) }, { merge: true });
          logger.info("refunded 1 credit after failure", { uid });
        }
      } catch (refundErr) {
        logger.warn("credit refund failed", { uid, err: String(refundErr) });
      }

      try {
        const forUid = (request.auth && request.auth.uid) || null;
        await logEvent(forUid, "generate_story_error", {
          message: err && err.message ? err.message : String(err),
        });
      } catch (e) {
        logger.debug("analytics error log failed", String(e));
      }

      if (err instanceof HttpsError) throw err;
      throw new HttpsError("internal", "Failed to generate story/audio.");
    }
  }
);

// List available voices
exports.listVoices = onCall({}, async () => {
  return { voices: VOICE_CATALOG };
});


