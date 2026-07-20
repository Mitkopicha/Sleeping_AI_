// Firebase core
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} from "firebase/functions";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA6xIYriLy0vBwhDjOoktWlQQqhzNHtfLE",
  authDomain: "bed-stories-bff80.firebaseapp.com",
  databaseURL: "https://bed-stories-bff80-default-rtdb.firebaseio.com",
  projectId: "bed-stories-bff80",
  storageBucket: "bed-stories-bff80.firebasestorage.app",
  messagingSenderId: "625912583218",
  appId: "1:625912583218:web:0fc9ef2b047c3740ce182b",
  measurementId: "G-2S8DVWS87N",
};

// Avoid double init
export const app =
  getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Core SDK
export const auth = getAuth(app);
export const db = getFirestore(app);

// Cloud Functions
export const functions = getFunctions(app, "us-central1");

// Use the local emulator when running on localhost
if (typeof window !== "undefined" && location.hostname === "localhost") {
  try {
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  } catch {
    // ignore if emulator not running
  }
}

// Call any callable by name
export const call = (name) => httpsCallable(functions, name);

// Auth helpers
export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);
export const onAuth = (cb) => onAuthStateChanged(auth, cb);

// Callable functions you use in the UI
export const fnGenerateSummaries = httpsCallable(
  functions,
  "generateSummaries"
);
export const fnGenerateStoryAndAudio = httpsCallable(
  functions,
  "generateStoryAndAudio"
);
export const fnListVoices = httpsCallable(functions, "listVoices");

// Stripe/promos
export const fnCreateCheckoutSession = httpsCallable(
  functions,
  "createCheckoutSession"
);
// Backend exports
export const fnRedeemPromoCode = httpsCallable(functions, "redeemPromoCode");

export default app;






