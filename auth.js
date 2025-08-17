import {
    auth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    db,
    firebaseConfig
} from './firebase.js';
import { selectors, showMessage } from './ui.js';
import { listenForData } from './data.js';

export let userId = null;
export const appId = firebaseConfig.appId;

export function setupAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userId = user.uid;
            selectors.userInfoSpan.textContent = `You are logged in with ID: ${userId}`;
            selectors.authSection.classList.add('hidden');
            selectors.calculatorUi.classList.remove('hidden');
            listenForData(userId, appId, db);
        } else {
            userId = null;
            selectors.authSection.classList.remove('hidden');
            selectors.calculatorUi.classList.add('hidden');
            showMessage("Signed Out", "You have been signed out. Please log in to access your data.");
        }
    });

    selectors.signupBtn.addEventListener('click', async () => {
        const email = selectors.emailInput.value;
        const password = selectors.passwordInput.value;

        if (!email || !password) {
            selectors.authStatus.textContent = "Please enter both email and password.";
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            selectors.authStatus.textContent = "Successfully created account! You are now logged in.";
            showMessage("Success!", "Account created. You are now logged in.");
        } catch (error) {
            console.error("Sign up failed:", error);
            selectors.authStatus.textContent = `Sign up failed: ${error.message}`;
            showMessage("Sign Up Failed", error.message);
        }
    });

    selectors.loginBtn.addEventListener('click', async () => {
        const email = selectors.emailInput.value;
        const password = selectors.passwordInput.value;

        if (!email || !password) {
            selectors.authStatus.textContent = "Please enter both email and password.";
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            selectors.authStatus.textContent = "Successfully logged in!";
            showMessage("Success!", "You have been logged in.");
        } catch (error) {
            console.error("Login failed:", error);
            selectors.authStatus.textContent = `Login failed: ${error.message}`;
            showMessage("Login Failed", error.message);
        }
    });

    selectors.logoutBtn.addEventListener('click', () => {
        signOut(auth);
    });
}