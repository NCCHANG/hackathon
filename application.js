// application.js
import {
  appId,
  onAuthChange,
  signIn,
  signUp,
  signOutUser,
  saveUserData,
  subscribeUserData,
  getUserData
} from "./firebase.js";

import { performCalculations } from "./calculator.js";
let hasShownCloudLoadedToast = false; // NEW: avoid duplicate "loaded" popups

// ---------- STATE ----------
let userId = null;
let guestMode = false;
let unsubscribeUserData = null; // track snapshot subscription

// ---------- DOM REFS (initialized later) ----------
let authSection,
  emailInput,
  passwordInput,
  signupBtn,
  loginBtn,
  guestBtn,
  authStatus,
  calculatorUi,
  userInfoSpan,
  logoutBtn,
  pastSemestersContainer,
  addSemesterBtn,
  coursesContainer,
  addCourseBtn,
  targetCgpaInput,
  calculateBtn,
  saveBtn,
  clearBtn,
  whatIfBtn,
  whatIfResults,
  whatIfSemGpa,
  whatIfCgpa,
  resultsSection,
  semGpaResult,
  cgpaResult,
  requiredGpaResult,
  insightsText,
  projectionsSection,
  proj25Result,
  proj30Result,
  proj35Result,
  proj40Result,
  messageBox,
  messageTitle,
  messageContent,
  messageCloseBtn;

// Re-select any refs that might be missing (defensive)
function ensureRefs() {
  authSection ??= document.getElementById('auth-section');
  emailInput ??= document.getElementById('email-input');
  passwordInput ??= document.getElementById('password-input');
  signupBtn ??= document.getElementById('signup-btn');
  loginBtn ??= document.getElementById('login-btn');
  guestBtn ??= document.getElementById('guest-btn');
  authStatus ??= document.getElementById('auth-status');

  calculatorUi ??= document.getElementById('calculator-ui');
  userInfoSpan ??= document.getElementById('user-info');
  logoutBtn ??= document.getElementById('logout-btn');

  pastSemestersContainer ??= document.getElementById('past-semesters-container');
  addSemesterBtn ??= document.getElementById('add-semester-btn');
  coursesContainer ??= document.getElementById('courses-container');
  addCourseBtn ??= document.getElementById('add-course-btn');

  targetCgpaInput ??= document.getElementById('target-cgpa');
  calculateBtn ??= document.getElementById('calculate-btn');
  saveBtn ??= document.getElementById('save-btn');
  clearBtn ??= document.getElementById('clear-btn');

  whatIfBtn ??= document.getElementById('what-if-btn');
  whatIfResults ??= document.getElementById('what-if-results');
  whatIfSemGpa ??= document.getElementById('what-if-sem-gpa');
  whatIfCgpa ??= document.getElementById('what-if-cgpa');

  resultsSection ??= document.getElementById('results-section');
  semGpaResult ??= document.getElementById('sem-gpa-result');
  cgpaResult ??= document.getElementById('cgpa-result');
  requiredGpaResult ??= document.getElementById('required-gpa-result');
  insightsText ??= document.getElementById('insights-text');
  projectionsSection ??= document.getElementById('projections-section');
  proj25Result ??= document.getElementById('proj-25-result');
  proj30Result ??= document.getElementById('proj-30-result');
  proj35Result ??= document.getElementById('proj-35-result');
  proj40Result ??= document.getElementById('proj-40-result');

  messageBox ??= document.getElementById('message-box');
  messageTitle ??= document.getElementById('message-title');
  messageContent ??= document.getElementById('message-content');
  messageCloseBtn ??= document.getElementById('message-close-btn');
}

// ---------- UI HELPERS ----------
function showMessage(title, content) {
  ensureRefs();
  if (!messageBox) return;
  messageTitle.textContent = title;
  messageContent.textContent = content;
  messageBox.classList.remove('hidden');
  messageBox.classList.add('flex');
}

function hideMessage() {
  ensureRefs();
  if (!messageBox) return;
  messageBox.classList.remove('flex');
  messageBox.classList.add('hidden');
}

// Build rows
function createSemesterRow(semName = '', semGpa = '', semCredits = '') {
  ensureRefs();
  const row = document.createElement('div');
  row.className = 'semester-row grid grid-cols-2 sm:grid-cols-4 gap-4 items-center bg-gray-100 p-4 rounded-lg border border-gray-200';
  row.innerHTML = `
    <div class="col-span-2 sm:col-span-1">
      <input type="text" placeholder="Semester Name" value="\${semName}" class="sem-name w-full p-2 border border-gray-300 rounded-lg">
    </div>
    <div class="col-span-1 sm:col-span-1">
      <input type="number" placeholder="GPA" value="\${semGpa}" step="0.01" class="sem-gpa w-full p-2 border border-gray-300 rounded-lg">
    </div>
    <div class="col-span-1 sm:col-span-1">
      <input type="number" placeholder="Credits" value="\${semCredits}" step="1" class="sem-credits w-full p-2 border border-gray-300 rounded-lg">
    </div>
    <div class="col-span-1 sm:col-span-1 flex justify-end">
      <button class="remove-semester-btn p-2 text-gray-400 hover:text-red-500 transition-colors">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd"/></svg>
      </button>
    </div>
  `.replace(/\$\{semName\}/g, semName).replace(/\$\{semGpa\}/g, semGpa).replace(/\$\{semCredits\}/g, semCredits);
  pastSemestersContainer.appendChild(row);
  row.querySelector('.remove-semester-btn').addEventListener('click', () => {
    pastSemestersContainer.removeChild(row);
  });
}

function createCourseRow(courseName = '', creditHours = '', grade = '') {
  ensureRefs();
  const row = document.createElement('div');
  row.className = 'course-row grid grid-cols-3 sm:grid-cols-4 gap-4 items-center';
  row.innerHTML = `
    <div class="col-span-2 sm:col-span-1">
      <input type="text" placeholder="Course Name" value="\${courseName}" class="course-name w-full p-3 border border-gray-300 rounded-lg">
    </div>
    <div class="col-span-1 sm:col-span-1">
      <input type="number" placeholder="Credits" value="\${creditHours}" step="1" class="credit-hours w-full p-3 border border-gray-300 rounded-lg">
    </div>
    <div class="col-span-2 sm:col-span-1">
      <select class="grade-input w-full p-3 border border-gray-300 rounded-lg">
        <option value="" disabled ${grade ? '' : 'selected'}>Select Grade</option>
        <option value="A+" ${grade==="A+"?'selected':''}>A+</option>
        <option value="A" ${grade==="A"?'selected':''}>A</option>
        <option value="A-" ${grade==="A-"?'selected':''}>A-</option>
        <option value="B+" ${grade==="B+"?'selected':''}>B+</option>
        <option value="B" ${grade==="B"?'selected':''}>B</option>
        <option value="B-" ${grade==="B-"?'selected':''}>B-</option>
        <option value="C+" ${grade==="C+"?'selected':''}>C+</option>
        <option value="C" ${grade==="C"?'selected':''}>C</option>
        <option value="C-" ${grade==="C-"?'selected':''}>C-</option>
        <option value="D+" ${grade==="D+"?'selected':''}>D+</option>
        <option value="D" ${grade==="D"?'selected':''}>D</option>
        <option value="F" ${grade==="F"?'selected':''}>F</option>
      </select>
    </div>
    <div class="col-span-1 sm:col-span-1 flex justify-end">
      <button class="remove-course-btn p-2 text-gray-400 hover:text-red-500 transition-colors">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd"/></svg>
      </button>
    </div>
  `.replace(/\$\{courseName\}/g, courseName).replace(/\$\{creditHours\}/g, creditHours);
  coursesContainer.appendChild(row);
  row.querySelector('.remove-course-btn').addEventListener('click', () => {
    coursesContainer.removeChild(row);
  });
}

// Expose for ai.js, if needed
window.createSemesterRow = createSemesterRow;

// ---------- RESET UI FOR GUEST / LOGOUT ----------
function resetUIToBlank() {
  ensureRefs();

  // Clear containers
  if (pastSemestersContainer) pastSemestersContainer.innerHTML = '';
  if (coursesContainer) coursesContainer.innerHTML = '';

  // Add one empty row each so UI isn't blank
  if (pastSemestersContainer) createSemesterRow();
  if (coursesContainer) createCourseRow();

  // Clear inputs / results
  if (targetCgpaInput) targetCgpaInput.value = '';

  resultsSection && resultsSection.classList.add('hidden');
  projectionsSection && projectionsSection.classList.add('hidden');
  whatIfResults && whatIfResults.classList.add('hidden');

  // Reset header text
  userInfoSpan && (userInfoSpan.textContent = 'Guest mode — changes are not saved to the cloud');
}

// ---------- DATA LOAD / SAVE ----------
function loadData(data) {
  ensureRefs();

  if (!pastSemestersContainer || !coursesContainer) return;

  targetCgpaInput && (targetCgpaInput.value = '');
  pastSemestersContainer.innerHTML = '';
  coursesContainer.innerHTML = '';

  resultsSection && resultsSection.classList.add('hidden');
  projectionsSection && projectionsSection.classList.add('hidden');
  whatIfResults && whatIfResults.classList.add('hidden');

  if (targetCgpaInput) targetCgpaInput.value = data?.targetCgpa || '';

  if (data?.semesters?.length) {
    data.semesters.forEach(sem => createSemesterRow(sem.name, sem.gpa, sem.credits));
  } else {
    createSemesterRow();
  }
  if (data?.courses?.length) {
    data.courses.forEach(c => createCourseRow(c.name, c.credits, c.grade));
  } else {
    createCourseRow();
  }
}

async function saveDataToCloud() {
  ensureRefs();
  if (guestMode || !userId) {
    showMessage("Login Required", "Please log in to save your data to the cloud.");
    return;
  }
  const data = { targetCgpa: targetCgpaInput?.value || '', semesters: [], courses: [] };

  document.querySelectorAll('.semester-row').forEach(row => {
    data.semesters.push({
      name: row.querySelector('.sem-name')?.value || '',
      gpa: row.querySelector('.sem-gpa')?.value || '',
      credits: row.querySelector('.sem-credits')?.value || ''
    });
  });
  document.querySelectorAll('.course-row').forEach(row => {
    data.courses.push({
      name: row.querySelector('.course-name')?.value || '',
      credits: row.querySelector('.credit-hours')?.value || '',
      grade: row.querySelector('.grade-input')?.value || ''
    });
  });

  try {
    await saveUserData(userId, data);
    showMessage("Save Successful", "Your data has been saved to the cloud!");
  } catch (e) {
    console.error(e);
    showMessage("Save Failed", "Could not save your data. Please check your connection.");
  }
}

// ---------- FIRESTORE SUBSCRIPTION CONTROL ----------
function startUserSubscription() {
  if (unsubscribeUserData) { unsubscribeUserData(); unsubscribeUserData = null; }

  const subscribedUserId = userId; // capture for guard

  unsubscribeUserData = subscribeUserData(
    userId,
    (data) => {
      if (guestMode || subscribedUserId !== userId) return;
      loadData(data || { semesters: [], courses: [] });
    },
    (error) => {
      if (guestMode || !subscribedUserId || subscribedUserId !== userId) return;
      console.error("Error getting document:", error);
      showMessage("Database Error", "Failed to load data from the cloud. Please check your connection.");
    }
  );
}

// ---------- INIT (after DOM ready) ----------
function init() {
  ensureRefs();

  // Message box close
  messageCloseBtn?.addEventListener('click', hideMessage);

  // Auth state changes
  onAuthChange(async (user) => {
    ensureRefs();
    if (user) {
      guestMode = false;
      userId = user.uid;
      userInfoSpan && (userInfoSpan.textContent = `You are logged in with ID: ${userId}`);
      authSection && authSection.classList.add('hidden');
      calculatorUi && calculatorUi.classList.remove('hidden');

      // One-time fetch
    try {
        const initial = await getUserData(userId);
        loadData(initial || { semesters: [], courses: [] });

        // NEW: show a one-time popup confirming successful cloud fetch
        if (!hasShownCloudLoadedToast) {
            showMessage("Cloud Sync", "Your data has been loaded from the cloud.");
            hasShownCloudLoadedToast = true;
        }
    } catch (e) {
        console.error("Initial fetch failed:", e);
    }


      // Realtime updates
      startUserSubscription();

    } else {
      // Signed-out state
      userId = null;
      if (unsubscribeUserData) { unsubscribeUserData(); unsubscribeUserData = null; }

      if (guestMode) {
        // If somehow in guestMode when Firebase says no user, ensure clean guest UI
        resetUIToBlank();
        authSection && authSection.classList.add('hidden');
        calculatorUi && calculatorUi.classList.remove('hidden');
      } else {
        // Normal sign-out path => show login, clear any prior user data from screen
        resetUIToBlank();
        calculatorUi && calculatorUi.classList.add('hidden');
        authSection && authSection.classList.remove('hidden');
        showMessage("Signed Out", "You have been signed out. Please log in to access your data.");
      }
    }
  });

  // Buttons: auth
  signupBtn?.addEventListener('click', async () => {
    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();
    if (!email || !password) { authStatus && (authStatus.textContent = "Please enter both email and password."); return; }
    try {
      await signUp(email, password);
      authStatus && (authStatus.textContent = "Successfully created account! You are now logged in.");
      showMessage("Success!", "Account created. You are now logged in.");
    } catch (err) {
      console.error(err);
      authStatus && (authStatus.textContent = `Sign up failed: ${err.message}`);
      showMessage("Sign Up Failed", err.message);
    }
  });

  loginBtn?.addEventListener('click', async () => {
    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();
    if (!email || !password) { authStatus && (authStatus.textContent = "Please enter both email and password."); return; }
    try {
      await signIn(email, password);
      authStatus && (authStatus.textContent = "Successfully logged in!");
      showMessage("Success!", "You have been logged in.");
    } catch (err) {
      console.error(err);
      authStatus && (authStatus.textContent = `Login failed: ${err.message}`);
      showMessage("Login Failed", err.message);
    }
  });

  // Continue as Guest — always start with clean UI
  guestBtn?.addEventListener('click', () => {
    guestMode = true;

    // Stop any existing real-time listener tied to a previous user
    if (unsubscribeUserData) { unsubscribeUserData(); unsubscribeUserData = null; }

    // Clear previous user's data from the screen
    resetUIToBlank();

    // Switch UI
    authSection && authSection.classList.add('hidden');
    calculatorUi && calculatorUi.classList.remove('hidden');
  });

  // Logout button
  logoutBtn?.addEventListener('click', () => {
    // Stop subscription ASAP to avoid late events repainting UI
    if (unsubscribeUserData) { unsubscribeUserData(); unsubscribeUserData = null; }

    if (guestMode) {
      // Leaving guest mode: go back to login, clear any guest data
      guestMode = false;
      resetUIToBlank();
      calculatorUi && calculatorUi.classList.add('hidden');
      authSection && authSection.classList.remove('hidden');
      userInfoSpan && (userInfoSpan.textContent = 'Welcome!');
    } else {
      // Real user logout
      resetUIToBlank(); // clear screen immediately, before auth callback returns
      signOutUser();
    }
  });

  // Buttons: UI
  addSemesterBtn?.addEventListener('click', () => createSemesterRow());
  addCourseBtn?.addEventListener('click', () => createCourseRow());

  saveBtn?.addEventListener('click', saveDataToCloud);

  clearBtn?.addEventListener('click', () => {
    ensureRefs();
    resetUIToBlank();
  });

  // Calculate & What-if
  calculateBtn?.addEventListener('click', () => {
    try {
      const result = performCalculations();

      const { semGpa, newCgpa, prevTotalCredits, prevTotalGpXCh, semTotalCredits, highestCreditCourse } = result;

      ensureRefs();
      semGpaResult && (semGpaResult.textContent = semGpa.toFixed(2));
      cgpaResult && (cgpaResult.textContent = newCgpa.toFixed(2));

      const target = parseFloat(targetCgpaInput?.value);
      if (!isNaN(target)) {
        if (prevTotalCredits === 0) {
          requiredGpaResult && (requiredGpaResult.textContent = 'N/A');
          insightsText && (insightsText.textContent = "You need at least one past semester entered. For now, your target CGPA equals this semester's GPA.");
        } else {
          const requiredTotalGpXCh = target * (prevTotalCredits + semTotalCredits);
          const requiredSemGpXCh = requiredTotalGpXCh - prevTotalGpXCh;
          const requiredGpa = requiredSemGpXCh / semTotalCredits;

          if (requiredGpa > 4.0 || requiredGpa < 0) {
            if (newCgpa >= target) {
              requiredGpaResult && (requiredGpaResult.textContent = 'Achieved!');
              insightsText && (insightsText.textContent = `Great! You're already above your target (${target.toFixed(2)}). Keep focusing on high-credit courses like "${highestCreditCourse.name}".`);
            } else {
              requiredGpaResult && (requiredGpaResult.textContent = 'Impossible');
              insightsText && (insightsText.textContent = `Mathematically impossible to reach ${target.toFixed(2)} this term with current credits. Push your highest-credit course: "${highestCreditCourse.name}".`);
            }
          } else {
            requiredGpaResult && (requiredGpaResult.textContent = requiredGpa.toFixed(2));
            insightsText && (insightsText.textContent = `To reach a ${target.toFixed(2)} CGPA, aim for at least ${requiredGpa.toFixed(2)} this term. Prioritize "${highestCreditCourse.name}".`);
          }
        }
      } else {
        requiredGpaResult && (requiredGpaResult.textContent = '--');
        insightsText && (insightsText.textContent =
          highestCreditCourse.name
            ? `Biggest impact: "${highestCreditCourse.name}" (${highestCreditCourse.credits} credits).`
            : `To maximize your CGPA, every grade counts—keep going!`
        );
      }

      if (prevTotalCredits > 0) {
        projectionsSection && projectionsSection.classList.remove('hidden');
        const futureCredits = semTotalCredits;
        const calc = (g) => {
          const futureGpXCh = g * futureCredits;
          const totalGpXCh = prevTotalGpXCh + futureGpXCh;
          const totalCredits = prevTotalCredits + futureCredits;
          return (totalGpXCh / totalCredits).toFixed(2);
        };
        proj25Result && (proj25Result.textContent = calc(2.5));
        proj30Result && (proj30Result.textContent = calc(3.0));
        proj35Result && (proj35Result.textContent = calc(3.5));
        proj40Result && (proj40Result.textContent = calc(4.0));
      } else {
        projectionsSection && projectionsSection.classList.add('hidden');
      }

      resultsSection && resultsSection.classList.remove('hidden');
      resultsSection && resultsSection.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      showMessage("Input Error", err.message || String(err));
    }
  });

  whatIfBtn?.addEventListener('click', () => {
    try {
      const result = performCalculations();
      ensureRefs();
      whatIfSemGpa && (whatIfSemGpa.textContent = result.semGpa.toFixed(2));
      whatIfCgpa && (whatIfCgpa.textContent = result.newCgpa.toFixed(2));
      whatIfResults && whatIfResults.classList.remove('hidden');
      whatIfResults && whatIfResults.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      showMessage("Input Error", err.message || String(err));
    }
  });
}

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
