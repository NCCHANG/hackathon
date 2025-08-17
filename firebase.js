import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

export {
    db,
    auth,
    firebaseConfig,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    doc,
    setDoc,
    onSnapshot
};