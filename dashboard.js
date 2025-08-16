import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Display user email
const userEmailElement = document.getElementById("userEmail");

onAuthStateChanged(auth, (user) => {
  if (user) {
    userEmailElement.textContent = "Logged in as: " + user.email;
  } else {
    // If no user, redirect back to login
    window.location.href = "login.html";
  }
});

// Logout function
window.logout = function () {
  signOut(auth).then(() => {
    alert("Logged out successfully!");
    window.location.href = "login.html";
  }).catch((error) => {
    alert(error.message);
  });
};

// Navigation (later you can replace with real pages)
window.goToUpload = function () {
  alert("Upload page not ready yet 🚧");
};

window.goToBrowse = function () {
  alert("Browse page not ready yet 🚧");
};

window.goToLeaderboard = function () {
  alert("Leaderboard not ready yet 🚧");
};
