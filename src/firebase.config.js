// src/firebase.config.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// আপনার Firebase কনসোল থেকে পাওয়া কনফিগারেশন (Keys) এখানে বসাবেন
const firebaseConfig = {
  apiKey: "AIzaSyBvJowHCuhPB-LHGY1Eo92e6cByGDWu9u0",
  authDomain: "dailyrise-27cd4.firebaseapp.com",
  projectId: "dailyrise-27cd4",
  storageBucket: "dailyrise-27cd4.firebasestorage.app",
  messagingSenderId: "235731485864",
  appId: "1:235731485864:web:081bc52e2b0256ac386e9d",
  measurementId: "G-DHYG7DPET9"
};
// লজিক: ফায়ারবেস ইনিশিয়ালাইজ করা হচ্ছে
const app = initializeApp(firebaseConfig);

// লজিক: প্রজেক্টের যেকোনো জায়গা থেকে যেন লগইন সিস্টেম অ্যাক্সেস করা যায়, সেজন্য auth এবং provider এক্সপোর্ট করা হচ্ছে
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();