import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, signOut, onAuthStateChanged, updateProfile
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBvJowHCuhPB-LHGY1Eo92e6cByGDWu9u0",
  authDomain: "dailyrise-27cd4.firebaseapp.com",
  projectId: "dailyrise-27cd4",
  storageBucket: "dailyrise-27cd4.firebasestorage.app",
  messagingSenderId: "235731485864",
  appId: "1:235731485864:web:081bc52e2b0256ac386e9d",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}
export async function signUpWithEmail(email, password, displayName) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(result.user, { displayName });
  return result.user;
}
export async function loginWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}
export async function logout() { await signOut(auth); }
export function onAuthChange(callback) { return onAuthStateChanged(auth, callback); }
export async function saveUserData(uid, data) {
  try {
    await setDoc(doc(db, "users", uid), { data, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch { return false; }
}
export async function loadUserData(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data().data : null;
  } catch { return null; }
}
export function subscribeUserData(uid, callback) {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    if (snap.exists()) callback(snap.data().data);
  });
}