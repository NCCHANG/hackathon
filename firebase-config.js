// Import functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdqdN_iXBK76ggoGMiail7GJzLnctAZPE",
  authDomain: "project-daily-planner.firebaseapp.com",
  projectId: "project-daily-planner",
  storageBucket: "project-daily-planner.firebasestorage.app",
  messagingSenderId: "341596285306",
  appId: "1:341596285306:web:29e0119ed1752bc01ecec3",
  measurementId: "G-1BRW0ZNJ8E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
