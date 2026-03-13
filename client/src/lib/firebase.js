import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAiTbxAihyNue_jSf7D-dm9LkI34FlGutM",
  authDomain: "chronoliteng-3b32f.firebaseapp.com",
  projectId: "chronoliteng-3b32f",
  storageBucket: "chronoliteng-3b32f.firebasestorage.app",
  messagingSenderId: "166599966335",
  appId: "1:166599966335:web:0c11934786d4589f1b494a",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;