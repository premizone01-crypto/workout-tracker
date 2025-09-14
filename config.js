/*
 * Configuration for the Workout Tracker PWA.
 *
 * USE_FIREBASE controls whether the app uses Firebase for authentication
 * and cloud data storage. When enabled, the app will prompt users to
 * register or log in and will sync their workouts to Firestore.
 *
 * To enable Firebase sync, set USE_FIREBASE to true and fill in the
 * FIREBASE_CONFIG object with your project credentials. You can find
 * these values in the Firebase console under Project Settings.
 */

// Toggle to enable/disable Firebase support
// Enable Firebase integration by setting this flag to true. When enabled,
// the app will prompt users to sign up or log in via Firebase Auth and
// persist workout data to Firestore. If set to false, the app operates
// entirely offline using browser storage.
const USE_FIREBASE = true;

// Firebase configuration. Replace the placeholder strings below with
// your actual Firebase project configuration. Leave fields blank if
// you haven't configured Firebase yet.
const FIREBASE_CONFIG = {
  // The API key is a unique identifier used by Firebase services. Keep this value
  // public as it's required for initializing Firebase on the client.
      // Updated API key copied directly from Firebase console. Ensure this matches
      // the Config snippet exactly to avoid auth/api-key-not-valid errors.
      apiKey: "AIzaSyBnwx25tL0Ur-IaNvPr-DukkmYUHAK1XTQ",
  // The authDomain is used for Firebase Authentication and hosting-related
  // redirects. It typically follows the pattern <projectId>.firebaseapp.com.
  authDomain: "workout-tracker-pwa-2f02c.firebaseapp.com",
  // The project ID uniquely identifies your Firebase project.
  projectId: "workout-tracker-pwa-2f02c",
  // The storage bucket is the Cloud Storage bucket associated with your
  // Firebase project. Note the "firebasestorage.app" domain used by modern
  // Firebase projects.
  // Use the default appspot.com domain for Cloud Storage. The original
  // bucket name from Firebase ends with `.appspot.com` rather than
  // `firebasestorage.app`, so we update it accordingly.
  storageBucket: "workout-tracker-pwa-2f02c.appspot.com",
  // The messaging sender ID is required for Firebase Cloud Messaging (FCM).
  messagingSenderId: "1006509696248",
  // The app ID uniquely identifies this specific web application instance.
  appId: "1:1006509696248:web:94c0202a71d23cf380bfcd",
  // measurementId is optional and used for Google Analytics if enabled. Leave
  // blank if you're not using analytics.
  measurementId: ""
};