// Import Firebase functions
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5soNs-LtbWvLWxYxRopYzxqCfDQziB7s",
  authDomain: "study-ai-app-fcf07.firebaseapp.com",
  projectId: "study-ai-app-fcf07",
  storageBucket: "study-ai-app-fcf07.firebasestorage.app",
  messagingSenderId: "922577615252",
  appId: "1:922577615252:web:9186008828e6d8ad7bf781"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account"
});