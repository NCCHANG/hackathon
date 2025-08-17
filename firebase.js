// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyBqe2vF4mmXbAjuWIcV_zCfc7hgzTFKSNQ",
  authDomain: "cgpacalculator-44f45.firebaseapp.com",
  projectId: "cgpacalculator-44f45",
  storageBucket: "cgpacalculator-44f45.firebasestorage.app",
  messagingSenderId: "976052597181",
  appId: "1:976052597181:web:6147fa61a823a4f0c062d4",
  measurementId: "G-5LGEGPHLED"
};
export const appId = firebaseConfig.projectId;

// --- INIT ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- AUTH HELPERS ---
export function onAuthChange(cb) {
  return onAuthStateChanged(auth, cb);
}

export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signOutUser() {
  return signOut(auth);
}

// --- DATA HELPERS ---
function userDataDocRef(userId) {
  return doc(db, "artifacts", appId, "users", userId, "cgpaData", "myCgpaData");
}

export async function saveUserData(userId, data) {
  const ref = userDataDocRef(userId);
  await setDoc(ref, data);
}

export async function getUserData(userId) {
  const ref = userDataDocRef(userId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export function subscribeUserData(userId, onData, onError) {
  const ref = userDataDocRef(userId);
  // Return the unsubscribe function so the caller can tear it down.
  return onSnapshot(
    ref,
    (snap) => onData(snap.exists() ? snap.data() : null),
    (err) => onError?.(err)
  );
}
