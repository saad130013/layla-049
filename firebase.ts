import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// =================================================================================================
// !! هام جداً !!
// !! VERY IMPORTANT !!
//
// استبدل القيم التالية بالقيم التي حصلت عليها من Firebase Console.
// Replace the following placeholder values with your actual Firebase project configuration.
// =================================================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE", // Example: "AIzaSy..."
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// --- SAFE FALLBACK INITIALIZATION ---
// This ensures the app doesn't crash if keys are missing (White Screen of Death).
// Instead, AppContext will detect null services and fall back to Mock Data.

let app;
let db: Firestore | null = null;
let auth: Auth | null = null;

// Check if config is still placeholder
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && firebaseConfig.projectId !== "YOUR_PROJECT_ID";

if (isConfigured) {
  try {
    // Initialize Firebase only if not already initialized
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    // db and auth remain null, triggering fallback in AppContext
  }
} else {
  console.warn("Firebase credentials missing. App running in Demo/Offline Mode.");
}

export { db, auth };
