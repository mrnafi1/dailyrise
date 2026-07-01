import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBvJowHCuhPB-LHGY1Eo92e6cByGDWu9u0",
  authDomain: "dailyrise-27cd4.firebaseapp.com",
  projectId: "dailyrise-27cd4",
  storageBucket: "dailyrise-27cd4.firebasestorage.app",
  messagingSenderId: "235731485864",
  appId: "1:235731485864:web:081bc52e2b0256ac386e9d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const gp = new GoogleAuthProvider();

export async function loginWithGoogle(){const r=await signInWithPopup(auth,gp);return r.user;}
export async function signUpWithEmail(email,password,displayName){const r=await createUserWithEmailAndPassword(auth,email,password);if(displayName)await updateProfile(r.user,{displayName});return r.user;}
export async function loginWithEmail(email,password){const r=await signInWithEmailAndPassword(auth,email,password);return r.user;}
export async function resetPassword(email){await sendPasswordResetEmail(auth,email);}
export async function logout(){await signOut(auth);}
export function onAuthChange(cb){return onAuthStateChanged(auth,cb);}
export async function saveUserData(uid,data){try{await setDoc(doc(db,"users",uid),{data,updatedAt:new Date().toISOString()},{merge:true});return true;}catch{return false;}}
export async function loadUserData(uid){try{const s=await getDoc(doc(db,"users",uid));return s.exists()?s.data().data:null;}catch{return null;}}
export function subscribeUserData(uid,cb){return onSnapshot(doc(db,"users",uid),(s)=>{if(s.exists())cb(s.data().data);});}
