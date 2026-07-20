import { initializeApp } from "firebase/app";
import { getAuth,onAuthStateChanged,signInWithEmailAndPassword,connectAuthEmulator,
} from "firebase/auth";
import {getFirestore,connectFirestoreEmulator,
} from "firebase/firestore";
import {getFunctions,httpsCallable,connectFunctionsEmulator,
} from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FB_APP_ID,
  measurementId: import.meta.env.VITE_FB_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// Core services
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, import.meta.env.VITE_FB_FUNCTIONS_REGION);

// Use emulators locally
if (import.meta.env.VITE_USE_EMULATORS === "1") {
  console.log("🔥 Using Firebase Emulators");
  connectAuthEmulator(auth, "http://127.0.0.1:9101");
  connectFirestoreEmulator(db, "127.0.0.1", 8091);
  connectFunctionsEmulator(functions, "127.0.0.1", 5003);
}

// Helper function for calling Firebase functions
const call = (name) => (data) => httpsCallable(functions, name)(data);

// Export instances AND helpers so .jsx can import from one place
export {
  app,
  auth,
  db,
  functions,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  httpsCallable,
  call,
};

