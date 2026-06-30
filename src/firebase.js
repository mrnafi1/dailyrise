// ══════════════════════════════════════════════════════════════════════════════
// FIREBASE CONFIG & HELPERS
// ══════════════════════════════════════════════════════════════════════════════
// 1. Go to https://console.firebase.google.com
// 2. Create a project → Add a Web App → Copy the config below
// 3. Enable Authentication → Sign-in method → Google + Email/Password
// 4. Enable Firestore Database → Create database (production mode)
// 5. Paste your config in the object below
// ══════════════════════════════════════════════════════════════════════════════

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";

// ── PASTE YOUR FIREBASE CONFIG HERE ─────────────────────────────────────────
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ── AUTH FUNCTIONS ───────────────────────────────────────────────────────────

// Google Sign-In
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// Email/Password Sign-Up
export async function signUpWithEmail(email, password, displayName) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
}

// Email/Password Sign-In
export async function loginWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

// Forgot Password — sends reset link to email
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

// Logout
export async function logout() {
  await signOut(auth);
}

// Listen to auth state changes
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── FIRESTORE DATA FUNCTIONS ─────────────────────────────────────────────────

// Save user's app data to Firestore
export async function saveUserData(uid, data) {
  try {
    await setDoc(doc(db, "users", uid), { data, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error("Save error:", err);
    return false;
  }
}

// Load user's app data from Firestore (one-time fetch)
export async function loadUserData(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data().data : null;
  } catch (err) {
    console.error("Load error:", err);
    return null;
  }
}

// Subscribe to real-time updates (data syncs automatically across devices)
export function subscribeUserData(uid, callback) {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    if (snap.exists()) callback(snap.data().data);
  });
}
