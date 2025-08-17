// application.js
import {
  onAuthChange, login, signup, logout,
  getUserData, saveUserData, subscribeUserData, appId
} from "./firebase.js";
import {
  performCalculationsFromDOM, computeRequiredGpa,
  predictCgpaForGpaList, GPA_CAP
} from "./calculator.js";
import { extractPastTrimesters } from "./ai.js";

/* ---------- DOM ---------- */
const authSection = document.getElementById('auth-section');
const calculatorUi = document.getElementById('calculator-ui');

const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const signupBtn = document.getElementById('signup-btn');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const guestBtn = document.getElementById('guest-btn');
const authStatus = document.getElementById('auth-status');
const userInfoSpan = document.getElementById('user-info');

const pastSemestersContainer = document.getElementById('past-semesters-container');
const coursesContainer = document.getElementById('courses-container');
const addSemesterBtn = document.getElementById('add-semester-btn');
const addCourseBtn = document.getElementById('add-course-btn');

const targetCgpaInput = document.getElementById('target-cgpa');
const calculateBtn = document.getElementById('calculate-btn');
const saveBtn = document.getElementById('save-btn');
const clearBtn = document.getElementById('clear-btn');

const resultsSection = document.getElementById('results-section');
const semGpaResult = document.getElementById('sem-gpa-result');
const cgpaResult = document.getElementById('cgpa-result');
const requiredGpaResult = document.getElementById('required-gpa-result');
const insightsText = document.getElementById('insights-text');

const projectionsSection = document.getElementById('projections-section');

const pastTriText = document.getElementById('past-tri-text');
const extractTriBtn = document.getElementById('extract-tri-btn');
const extractTriStatus = document.getElementById('extract-tri-status');

// Message box
const messageBox = document.getElementById('message-box');
const messageTitle = document.getElementById('message-title');
const messageContent = document.getElementById('message-content');
const messageCloseBtn = document.getElementById('message-close-btn');

function showMessage(title, content) {
  messageTitle.textContent = title;
  messageContent.textContent = content;
  messageBox.classList.remove('hidden');
  messageBox.classList.add('flex');
}
messageCloseBtn.addEventListener('click', () => {
  messageBox.classList.remove('flex');
  messageBox.classList.add('hidden');
});

/* ---------- UI builders ---------- */
function createSemesterRow(semName = '', semGpa = '', semCredits = '') {
  const row = document.createElement('div');
  row.className = 'semester-row grid grid-cols-2 sm:grid-cols-4 gap-4 items-center bg-gray-100 p-4 rounded-lg border border-gray-200';
  row.innerHTML = `
    <div class="col-span-2 sm:col-span-1">
      <input type="text" placeholder="Semester Name" value="${semName}" class="sem-name w-full p-2 border border-gray-300 rounded-lg">
    </div>
    <div class="col-span-1 sm:col-span-1">
      <input type="number" placeholder="GPA" value="${semGpa}" step="0.01" class="sem-gpa w-full p-2 border border-gray-300 rounded-lg">
    </div>
    <div class="col-span-1 sm:col-span-1">
      <input type="number" placeholder="Credits" value="${semCredits}" step="1" class="sem-credits w-full p-2 border border-gray-300 rounded-lg">
    </div>
    <div class="col-span-1 sm:col-span-1 flex justify-end">
      <button class="remove-semester-btn p-2 text-gray-400 hover:text-red-500 transition-colors duration-150" aria-label="Remove">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd"/></svg>
      </button>
    </div>`;
  pastSemestersContainer.appendChild(row);
  row.querySelector('.remove-semester-btn').addEventListener('click', () => {
    pastSemestersContainer.removeChild(row);
  });
}

function createCourseRow(courseName = '', creditHours = '', grade = '') {
  const row = document.createElement('div');
  row.className = 'course-row grid grid-cols-3 sm:grid-cols-4 gap-4 items-center';
  row.innerHTML = `
    <div class="col-span-2 sm:col-span-1">
      <input type="text" placeholder="Course Name" value="${courseName}" class="course-name w-full p-3 border border-gray-300 rounded-lg">
    </div>
    <div class="col-span-1 sm:col-span-1">
      <input type="number" placeholder="Credits" value="${creditHours}" step="1" class="credit-hours w-full p-3 border border-gray-300 rounded-lg">
    </div>
    <div class="col-span-2 sm:col-span-1">
      <select class="grade-input w-full p-3 border border-gray-300 rounded-lg">
        <option value="" disabled ${grade ? '' : 'selected'}>Select Grade</option>
        ${['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','F']
          .map(g => `<option value="${g}" ${g===grade ? 'selected':''}>${g}</option>`).join('')}
      </select>
    </div>
    <div class="col-span-1 sm:col-span-1 flex justify-end">
      <button class="remove-course-btn p-2 text-gray-400 hover:text-red-500 transition-colors duration-150" aria-label="Remove">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd"/></svg>
      </button>
    </div>`;
  coursesContainer.appendChild(row);
  row.querySelector('.remove-course-btn').addEventListener('click', () => {
    coursesContainer.removeChild(row);
  });
}

/* ---------- Auth state & data ---------- */
let userId = null;
let guestMode = false;
let unsubscribeUserData = null;
let hasShownCloudLoadedToast = false;

function clearAllInputs() {
  pastSemestersContainer.innerHTML = '';
  coursesContainer.innerHTML = '';
  targetCgpaInput.value = '';
  document.getElementById('what-if-sem-gpa')?.textContent && (document.getElementById('what-if-sem-gpa').textContent = '--');
  document.getElementById('what-if-cgpa')?.textContent && (document.getElementById('what-if-cgpa').textContent = '--');
  resultsSection.classList.add('hidden');
  projectionsSection.classList.add('hidden');
}

function loadData(data) {
  // Reset UI first
  clearAllInputs();

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

  if (data?.targetCgpa) {
    targetCgpaInput.value = data.targetCgpa;
  }
}

function startUserSubscription() {
  if (!userId || guestMode) return;
  if (unsubscribeUserData) unsubscribeUserData();

  unsubscribeUserData = subscribeUserData(
    userId,
    (data) => {
      if (guestMode) return;
      loadData(data || { semesters: [], courses: [] });
    },
    (err) => {
      if (guestMode) return;
      console.error("Realtime listener error:", err);
      showMessage("Database Error", "Failed to load data from the cloud. Please check your connection.");
    }
  );
}

onAuthChange(async (user) => {
  if (user) {
    // logged in
    userId = user.uid;
    guestMode = false;
    hasShownCloudLoadedToast = false;

    userInfoSpan.textContent = `You are logged in with ID: ${userId}`;
    authSection.classList.add('hidden');
    calculatorUi.classList.remove('hidden');

    // one-time fetch
    try {
      const initial = await getUserData(userId);
      loadData(initial || { semesters: [], courses: [] });
      if (!hasShownCloudLoadedToast) {
        showMessage("Cloud Sync", "Your data has been loaded from the cloud.");
        hasShownCloudLoadedToast = true;
      }
    } catch (e) {
      console.error("Initial fetch failed:", e);
    }

    startUserSubscription();
  } else {
    // signed out
    userId = null;
    guestMode = false;
    if (unsubscribeUserData) { unsubscribeUserData(); unsubscribeUserData = null; }

    // Hide app & clear
    calculatorUi.classList.add('hidden');
    authSection.classList.remove('hidden');
    loadData({ semesters: [], courses: [], targetCgpa: '' }); // ensure no prior data remains
    showMessage("Signed Out", "You have been signed out. Please log in to access your data.");
  }
});

/* ---------- Auth buttons ---------- */
signupBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) { authStatus.textContent = "Please enter both email and password."; return; }
  try {
    await signup(email, password);
    authStatus.textContent = "Account created. You are now logged in.";
    showMessage("Success!", "You have been logged in.");
  } catch (e) {
    console.error(e);
    authStatus.textContent = `Sign up failed: ${e.message}`;
    showMessage("Sign Up Failed", e.message);
  }
});

loginBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) { authStatus.textContent = "Please enter both email and password."; return; }
  try {
    await login(email, password);
    authStatus.textContent = "Successfully logged in!";
    showMessage("Success!", "You have been logged in.");
  } catch (e) {
    console.error(e);
    authStatus.textContent = `Login failed: ${e.message}`;
    showMessage("Login Failed", e.message);
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    await logout();
  } catch (e) {
    console.error(e);
    showMessage("Logout Error", e.message);
  }
});

guestBtn.addEventListener('click', () => {
  guestMode = true;
  userId = null;
  if (unsubscribeUserData) { unsubscribeUserData(); unsubscribeUserData = null; }
  authSection.classList.add('hidden');
  calculatorUi.classList.remove('hidden');
  userInfoSpan.textContent = `Guest mode (not saved)`;
  // Make sure no previous user’s data remains
  loadData({ semesters: [], courses: [], targetCgpa: '' });
  showMessage("Guest Mode", "You’re using the app as a guest. Saving will require login.");
});

/* ---------- Add row buttons ---------- */
addSemesterBtn.addEventListener('click', () => createSemesterRow());
addCourseBtn.addEventListener('click', () => createCourseRow());

/* ---------- Save & Clear ---------- */
saveBtn.addEventListener('click', async () => {
  if (guestMode || !userId) {
    showMessage("Login Required", "Please log in to save your data to the cloud.");
    return;
  }
  const data = collectDataForSave();
  try {
    await saveUserData(userId, data);
    showMessage("Save Successful", "Your data has been saved to the cloud!");
  } catch (e) {
    console.error(e);
    showMessage("Save Failed", "Could not save your data. Please check your connection.");
  }
});

clearBtn.addEventListener('click', () => {
  loadData({ semesters: [], courses: [], targetCgpa: '' });
});

/* ---------- Calculate ---------- */
calculateBtn.addEventListener('click', () => {
  try {
    const result = performCalculationsFromDOM();

    // Show main results
    document.getElementById('sem-gpa-result').textContent = isFinite(result.semGpa) ? result.semGpa.toFixed(2) : '--';
    document.getElementById('cgpa-result').textContent    = isFinite(result.newCgpa) ? result.newCgpa.toFixed(2) : '--';

    // Required GPA for target
    const target = parseFloat(targetCgpaInput?.value);
    const req = computeRequiredGpa(
      target,
      result.prevTotalGpXCh,
      result.prevTotalCredits,
      result.semTotalCredits,
      result.newCgpa
    );

    if (!isFinite(target)) {
      requiredGpaResult.textContent = '--';
      insightsText.textContent = result.highestCreditCourse?.name
        ? `Biggest impact: "${result.highestCreditCourse.name}" (${result.highestCreditCourse.credits} credits).`
        : `To maximize your CGPA, every grade counts—keep going!`;
    } else {
      switch (req.status) {
        case 'no-history':
          requiredGpaResult.textContent = 'N/A';
          insightsText.textContent = "You have no prior credits. Your target CGPA equals this semester's GPA.";
          break;
        case 'no-sem-credits':
          requiredGpaResult.textContent = '--';
          insightsText.textContent = "Add at least one course (with credits) to compute the required GPA.";
          break;
        case 'achieved':
          requiredGpaResult.textContent = 'Achieved!';
          insightsText.textContent = `Great! Your current entries already meet your target (${target.toFixed(2)}).`;
          break;
        case 'ok':
          requiredGpaResult.textContent = req.value.toFixed(2);
          insightsText.textContent =
            `To reach a ${target.toFixed(2)} CGPA, aim for at least ${req.value.toFixed(2)} this term. ` +
            (result.highestCreditCourse?.name
              ? `Prioritize "${result.highestCreditCourse.name}" (${result.highestCreditCourse.credits} credits).`
              : `Focus on your highest-credit courses for maximum impact.`);
          break;
        case 'impossible':
          requiredGpaResult.textContent = 'Impossible';
          insightsText.textContent =
            `With ${result.semTotalCredits} credit(s) this term, it’s mathematically impossible to reach a ${target.toFixed(2)} CGPA. ` +
            (Number.isFinite(req.extraCredits)
              ? `At a ${GPA_CAP.toFixed(2)} GPA, you’d need ~${req.extraCredits} additional credit(s) this term to make it possible.`
              : ``);
          break;
        default:
          requiredGpaResult.textContent = '--';
          insightsText.textContent = 'Enter a valid target to see the required GPA.';
      }
    }

    // Projections (2.0 / 2.5 / 3.0 / 3.5 / 4.0)
    if (result.prevTotalCredits > 0 && result.semTotalCredits > 0) {
      const projections = predictCgpaForGpaList(result, [2.0, 2.5, 3.0, 3.5, 4.0]);
      projectionsSection.classList.remove('hidden');
      setText('proj-20-result', projections[2.0]);
      setText('proj-25-result', projections[2.5]);
      setText('proj-30-result', projections[3.0]);
      setText('proj-35-result', projections[3.5]);
      setText('proj-40-result', projections[4.0]);
    } else {
      projectionsSection.classList.add('hidden');
    }

    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  } catch (e) {
    console.error(e);
    showMessage("Input Error", e.message || String(e));
  }
});

function setText(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = Number.isFinite(val) ? val.toFixed(2) : '--';
}

function collectDataForSave() {
  const data = { targetCgpa: targetCgpaInput.value || '', semesters: [], courses: [] };
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
  return data;
}

/* ---------- AI: Past Terms button ---------- */
extractTriBtn.addEventListener('click', async () => {
  const text = pastTriText.value.trim();
  if (!text) { showMessage("Input Required", "Please paste transcript text first."); return; }

  extractTriBtn.disabled = true;
  extractTriStatus.textContent = "Extracting…";

  try {
    const terms = await extractPastTrimesters(text);
    if (!terms.length) {
      extractTriStatus.textContent = 'No terms added.';
      showMessage("No Recent Terms", "Couldn’t find trimester/semester summaries from the last 12 months.");
      return;
    }
    // Append to Past Semesters
    terms.forEach(t => {
      const name = t?.name || 'Trimester/Semester';
      const gpa = (typeof t?.gpa === 'number' ? t.gpa.toFixed(2) : '');
      const credits = (typeof t?.credits === 'number' ? t.credits : '');
      createSemesterRow(name, gpa, credits);
    });
    extractTriStatus.textContent = `Added ${terms.length} term(s).`;
  } catch (e) {
    console.error(e);
    showMessage("Extraction Failed", e.message || "Could not extract trimester summaries.");
    extractTriStatus.textContent = '';
  } finally {
    extractTriBtn.disabled = false;
  }
});

/* ---------- Default rows on first load (guest before login) ---------- */
createSemesterRow();
createCourseRow();
