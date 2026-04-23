// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVty30S6y_qc1eMs3kVctcIpLt6Suw4dA",
  authDomain: "mudapos-e8a4a.firebaseapp.com",
  projectId: "mudapos-e8a4a",
  storageBucket: "mudapos-e8a4a.firebasestorage.app",
  messagingSenderId: "864215339664",
  appId: "1:864215339664:web:1a97898b85ca3c1cb3be15"
};

const app = initializeApp(firebaseConfig);
const dbCloud = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { app, dbCloud, auth, provider, signInWithPopup, signOut, onAuthStateChanged };
