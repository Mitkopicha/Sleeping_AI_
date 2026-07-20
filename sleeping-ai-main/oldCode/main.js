// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA6xIYriLy0vBwhDjOoktWlQQqhzNHtfLE",
  authDomain: "bed-stories-bff80.firebaseapp.com",
  projectId: "bed-stories-bff80",
  storageBucket: "bed-stories-bff80.firebasestorage.app",
  messagingSenderId: "625912583218",
  appId: "1:625912583218:web:0fc9ef2b047c3740ce182b",
  measurementId: "G-2S8DVWS87N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);