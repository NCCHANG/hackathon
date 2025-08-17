// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Init
const firebaseConfig = {
  apiKey: "AIzaSyBqe2vF4mmXbAjuWIcV_zCfc7hgzTFKSNQ",
  authDomain: "cgpacalculator-44f45.firebaseapp.com",
  projectId: "cgpacalculator-44f45",
  storageBucket: "cgpacalculator-44f45.firebasestorage.app",
  messagingSenderId: "976052597181",
  appId: "1:976052597181:web:6147fa61a823a4f0c062d4",
  measurementId: "G-5LGEGPHLED"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export const appId = firebaseConfig.projectId;

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signup(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return signOut(auth);
}

export async function getUserData(userId) {
  const ref = doc(db, 'artifacts', appId, 'users', userId, 'cgpaData', 'myCgpaData');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function saveUserData(userId, data) {
  const ref = doc(db, 'artifacts', appId, 'users', userId, 'cgpaData', 'myCgpaData');
  return setDoc(ref, data);
}

export function subscribeUserData(userId, onData, onError) {
  const ref = doc(db, 'artifacts', appId, 'users', userId, 'cgpaData', 'myCgpaData');
  return onSnapshot(ref, (snap) => {
    onData(snap.exists() ? snap.data() : null);
  }, onError);
}
