
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBqe2vF4mmXbAjuWIcV_zCfc7hgzTFKSNQ",
    authDomain: "cgpacalculator-44f45.firebaseapp.com",
    projectId: "cgpacalculator-44f45",
    storageBucket: "cgpacalculator-44f45.firebasestorage.app",
    messagingSenderId: "976052597181",
    appId: "1:976052597181:web:6147fa61a823a4f0c062d4",
    measurementId: "G-5LGEGPHLED"
};

// This is a dynamic app ID based on your project for storing user-specific data.
const appId = firebaseConfig.projectId;

let db;
let auth;
let userId;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
db = getFirestore(app);
auth = getAuth(app);

// UI elements
const authSection = document.getElementById('auth-section');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const signupBtn = document.getElementById('signup-btn');
const loginBtn = document.getElementById('login-btn');
const authStatus = document.getElementById('auth-status');
const calculatorUi = document.getElementById('calculator-ui');
const userInfoSpan = document.getElementById('user-info');
const logoutBtn = document.getElementById('logout-btn');
const parseTranscriptBtn = document.getElementById('parse-transcript-btn');
const transcriptText = document.getElementById('transcript-text');
const parseSpinner = document.getElementById('parse-spinner');
const parseText = document.getElementById('parse-text');

// Mapping of letter grades to grade points
const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0,
    'F': 0.0
};

const pastSemestersContainer = document.getElementById('past-semesters-container');
const addSemesterBtn = document.getElementById('add-semester-btn');
const targetCgpaInput = document.getElementById('target-cgpa');
const coursesContainer = document.getElementById('courses-container');
const addCourseBtn = document.getElementById('add-course-btn');
const calculateBtn = document.getElementById('calculate-btn');
const saveBtn = document.getElementById('save-btn');
const clearBtn = document.getElementById('clear-btn');
const whatIfBtn = document.getElementById('what-if-btn');
const whatIfResults = document.getElementById('what-if-results');
const whatIfSemGpa = document.getElementById('what-if-sem-gpa');
const whatIfCgpa = document.getElementById('what-if-cgpa');

const resultsSection = document.getElementById('results-section');
const semGpaResult = document.getElementById('sem-gpa-result');
const cgpaResult = document.getElementById('cgpa-result');
const requiredGpaResult = document.getElementById('required-gpa-result');
const insightsText = document.getElementById('insights-text');
const projectionsSection = document.getElementById('projections-section');
const proj25Result = document.getElementById('proj-25-result');
const proj30Result = document.getElementById('proj-30-result');
const proj35Result = document.getElementById('proj-35-result');
const proj40Result = document.getElementById('proj-40-result');
const messageBox = document.getElementById('message-box');
const messageTitle = document.getElementById('message-title');
const messageContent = document.getElementById('message-content');
const messageCloseBtn = document.getElementById('message-close-btn');

// Function to show a custom message box instead of alert()
function showMessage(title, content) {
    messageTitle.textContent = title;
    messageContent.textContent = content;
    messageBox.classList.remove('hidden');
    messageBox.classList.add('flex');
}

// Close the message box
messageCloseBtn.addEventListener('click', () => {
    messageBox.classList.remove('flex');
    messageBox.classList.add('hidden');
});

// Function to clear all inputs and hide results
function clearAllInputs() {
    pastSemestersContainer.innerHTML = '';
    coursesContainer.innerHTML = '';
    targetCgpaInput.value = '';
    transcriptText.value = '';
    resultsSection.classList.add('hidden');
    projectionsSection.classList.add('hidden');
    whatIfResults.classList.add('hidden');
}

// Function to create a new past semester row
function createSemesterRow(semName = '', semGpa = '', semCredits = '') {
    const semesterRow = document.createElement('div');
    semesterRow.className = 'semester-row grid grid-cols-2 sm:grid-cols-4 gap-4 items-center bg-gray-100 p-4 rounded-lg border border-gray-200';
    semesterRow.innerHTML = `
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
                <button class="remove-semester-btn p-2 text-gray-400 hover:text-red-500 transition-colors duration-150">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd"></path></svg>
                </button>
            </div>
        `;
    pastSemestersContainer.appendChild(semesterRow);
    semesterRow.querySelector('.remove-semester-btn').addEventListener('click', () => {
    pastSemestersContainer.removeChild(semesterRow);
    });
}

// Function to create a new course input row
function createCourseRow(courseName = '', creditHours = '', grade = '') {
    const courseRow = document.createElement('div');
    courseRow.className = 'course-row grid grid-cols-3 sm:grid-cols-4 gap-4 items-center';
    courseRow.innerHTML = `
            <div class="col-span-2 sm:col-span-1">
                <input type="text" placeholder="Course Name" value="${courseName}" class="course-name w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150">
            </div>
            <div class="col-span-1 sm:col-span-1">
                <input type="number" placeholder="Credits" value="${creditHours}" step="1" class="credit-hours w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150">
            </div>
            <div class="col-span-2 sm:col-span-1">
                <select class="grade-input w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150">
                    <option value="" disabled selected>Select Grade</option>
                    <option value="A+" ${grade === 'A+' ? 'selected' : ''}>A+</option>
                    <option value="A" ${grade === 'A' ? 'selected' : ''}>A</option>
                    <option value="A-" ${grade === 'A-' ? 'selected' : ''}>A-</option>
                    <option value="B+" ${grade === 'B+' ? 'selected' : ''}>B+</option>
                    <option value="B" ${grade === 'B' ? 'selected' : ''}>B</option>
                    <option value="B-" ${grade === 'B-' ? 'selected' : ''}>B-</option>
                    <option value="C+" ${grade === 'C+' ? 'selected' : ''}>C+</option>
                    <option value="C" ${grade === 'C' ? 'selected' : ''}>C</option>
                    <option value="C-" ${grade === 'C-' ? 'selected' : ''}>C-</option>
                    <option value="D+" ${grade === 'D+' ? 'selected' : ''}>D+</option>
                    <option value="D" ${grade === 'D' ? 'selected' : ''}>D</option>
                    <option value="F" ${grade === 'F' ? 'selected' : ''}>F</option>
                </select>
            </div>
            <div class="col-span-1 sm:col-span-1 flex justify-end">
                <button class="remove-course-btn p-2 text-gray-400 hover:text-red-500 transition-colors duration-150">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd"></path></svg>
                </button>
            </div>
        `;
    coursesContainer.appendChild(courseRow);
    courseRow.querySelector('.remove-course-btn').addEventListener('click', () => {
    coursesContainer.removeChild(courseRow);
    });
}

// Function to save all data to Firebase
async function saveData() {
    if (!userId) {
    showMessage("Authentication Required", "Please log in before saving your data.");
    return;
    }

    const data = {
    targetCgpa: targetCgpaInput.value,
    semesters: [],
    courses: []
    };

    // Collect past semesters
    const semesterRows = document.querySelectorAll('.semester-row');
    semesterRows.forEach(row => {
    data.semesters.push({
        name: row.querySelector('.sem-name').value,
        gpa: row.querySelector('.sem-gpa').value,
        credits: row.querySelector('.sem-credits').value
    });
    });

    // Collect current semester courses
    const courseRows = document.querySelectorAll('.course-row');
    courseRows.forEach(row => {
    data.courses.push({
        name: row.querySelector('.course-name').value,
        credits: row.querySelector('.credit-hours').value,
        grade: row.querySelector('.grade-input').value
    });
    });

    const docRef = doc(db, 'artifacts', appId, 'users', userId, 'cgpaData', 'myCgpaData');
    try {
    await setDoc(docRef, data);
    showMessage("Save Successful", "Your data has been saved to the cloud!");
    } catch (e) {
    console.error("Error adding document: ", e);
    showMessage("Save Failed", "Could not save your data. Please check your connection.");
    }
}

// Function to load all data from a JS object
function loadData(data) {
    // Clear existing inputs before populating
    targetCgpaInput.value = '';
    pastSemestersContainer.innerHTML = '';
    coursesContainer.innerHTML = '';
    transcriptText.value = '';
    resultsSection.classList.add('hidden');
    projectionsSection.classList.add('hidden');
    whatIfResults.classList.add('hidden');

    targetCgpaInput.value = data.targetCgpa || '';

    if (data.semesters && data.semesters.length > 0) {
    data.semesters.forEach(semester => {
        createSemesterRow(semester.name, semester.gpa, semester.credits);
    });
    } else {
    createSemesterRow();
    }

    if (data.courses && data.courses.length > 0) {
    data.courses.forEach(course => {
        createCourseRow(course.name, course.credits, course.grade);
    });
    } else {
    createCourseRow();
    }
}

// --- AUTHENTICATION FLOW ---

// Listen for authentication state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
    // User is signed in
    userId = user.uid;
    userInfoSpan.textContent = `You are logged in with ID: ${userId}`;
    authSection.classList.add('hidden');
    calculatorUi.classList.remove('hidden');

    // Now that we have a user, listen for their data
    listenForData();

    } else {
    // User is signed out
    userId = null;
    authSection.classList.remove('hidden');
    calculatorUi.classList.add('hidden');
    showMessage("Signed Out", "You have been signed out. Please log in to access your data.");
    }
});

// Handle sign up button click
signupBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
    authStatus.textContent = "Please enter both email and password.";
    return;
    }

    try {
    await createUserWithEmailAndPassword(auth, email, password);
    authStatus.textContent = "Successfully created account! You are now logged in.";
    showMessage("Success!", "Account created. You are now logged in.");
    } catch (error) {
    console.error("Sign up failed:", error);
    authStatus.textContent = `Sign up failed: ${error.message}`;
    showMessage("Sign Up Failed", error.message);
    }
});

// Handle login button click
loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
    authStatus.textContent = "Please enter both email and password.";
    return;
    }

    try {
    await signInWithEmailAndPassword(auth, email, password);
    authStatus.textContent = "Successfully logged in!";
    showMessage("Success!", "You have been logged in.");
    } catch (error) {
    console.error("Login failed:", error);
    authStatus.textContent = `Login failed: ${error.message}`;
    showMessage("Login Failed", error.message);
    }
});

// Handle logout button click
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// Function to listen for data after successful authentication
const listenForData = () => {
    const docRef = doc(db, 'artifacts', appId, 'users', userId, 'cgpaData', 'myCgpaData');
    onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
        loadData(docSnap.data());
        showMessage("Data Loaded", "Your data has been loaded from the cloud.");
    } else {
        showMessage("Welcome!", "No saved data found. Start by adding your past semesters and courses.");
        loadData({ semesters: [], courses: [] }); // Load empty data to clear inputs
    }
    }, (error) => {
    console.error("Error getting document:", error);
    showMessage("Database Error", "Failed to load data from the cloud. Please check your connection.");
    });
};

// Event listeners for adding rows
addSemesterBtn.addEventListener('click', () => createSemesterRow());
addCourseBtn.addEventListener('click', () => createCourseRow());

// Event listener for the save button
saveBtn.addEventListener('click', saveData);

// Event listener for the clear button
clearBtn.addEventListener('click', clearAllInputs);

// Event listener for the "Parse" button
parseTranscriptBtn.addEventListener('click', async () => {
    const text = transcriptText.value.trim();
    if (text === '') {
    showMessage("Input Required", "Please paste your transcript text into the box first.");
    return;
    }

    // Show loading state
    parseTranscriptBtn.disabled = true;
    parseSpinner.classList.remove('hidden');
    parseText.textContent = 'Parsing...';

    try {
    const prompt = `You are a helpful assistant that extracts academic course information from raw text. The user will provide text from a university transcript or similar document. Your task is to identify and extract each course's name, credit hours, and letter grade.

            Please provide the extracted data as a JSON array of objects. If you cannot find a piece of information for a course, use a null value.

            Here is an example of the desired format:
            [
                {
                    "name": "Introduction to Computer Science",
                    "credits": 3,
                    "grade": "A"
                },
                {
                    "name": "Calculus I",
                    "credits": 4,
                    "grade": "B+"
                }
            ]

            Now, process the following text:
            """
            ${text}
            """`;

    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = {
        contents: chatHistory,
        generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
            type: "ARRAY",
            items: {
            type: "OBJECT",
            properties: {
                "name": { "type": "STRING" },
                "credits": { "type": "NUMBER" },
                "grade": { "type": "STRING" }
            }
            }
        }
        }
    };

    const apiKey = "AIzaSyBB476jafxuZ0LbQaboaiEoKpB0U4bK0Co";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    const jsonString = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonString) {
        throw new Error("API response was empty or malformed.");
    }

    const parsedCourses = JSON.parse(jsonString);

    if (!Array.isArray(parsedCourses)) {
        throw new Error("Parsed data is not an array.");
    }

    // Clear current courses before adding new ones
    coursesContainer.innerHTML = '';
    parsedCourses.forEach(course => {
        // Check for valid data before creating the row
        if (course.name && course.credits && course.grade) {
        createCourseRow(course.name, course.credits, course.grade);
        }
    });

    showMessage("Success!", "Courses have been automatically added. Please review the details.");

    } catch (error) {
    console.error("Parsing failed:", error);
    showMessage("Parsing Failed", "There was an error parsing the text. Please ensure the text format is clear and try again, or enter the data manually.");
    } finally {
    // Hide loading state
    parseTranscriptBtn.disabled = false;
    parseSpinner.classList.add('hidden');
    parseText.textContent = 'Parse & Fill Courses';
    }
});

// Main calculation function, used by both "Calculate" and "What If"
function performCalculations() {
    let prevTotalGpXCh = 0;
    let prevTotalCredits = 0;
    const semesterRows = document.querySelectorAll('.semester-row');
    for (const row of semesterRows) {
    const gpa = parseFloat(row.querySelector('.sem-gpa').value);
    const credits = parseFloat(row.querySelector('.sem-credits').value);
    if(credits == 0) {
        continue;
    }
    if (isNaN(gpa) || isNaN(credits) || credits < 0) {
        return { error: "Please ensure all past semester fields have a valid GPA and Credits." };
    }
    prevTotalGpXCh += gpa * credits;
    prevTotalCredits += credits;
    }

    let semTotalGpXCh = 0;
    let semTotalCredits = 0;
    let highestCreditCourse = { name: null, credits: 0 };

    const courseRows = document.querySelectorAll('.course-row');
    if (courseRows.length === 0) {
    return { error: "Please add at least one current course." };
    }

    for (const row of courseRows) {
    const creditHoursInput = row.querySelector('.credit-hours');
    const gradeSelect = row.querySelector('.grade-input');
    const courseNameInput = row.querySelector('.course-name');

    const creditHours = parseFloat(creditHoursInput.value);
    const grade = gradeSelect.value;
    const courseName = courseNameInput.value || "This Course";

    if (creditHours == 0) {
        continue;
    }
    if (isNaN(creditHours) || !grade) {
        return { error: "Please enter a valid number for credit hours (greater or equals to 0) and select a grade for each course." };
    }

    const gp = gradePoints[grade];
    semTotalGpXCh += gp * creditHours;
    semTotalCredits += creditHours;

    if (creditHours > highestCreditCourse.credits) {
        highestCreditCourse.credits = creditHours;
        highestCreditCourse.name = courseName;
    }
    }

    const semGpa = semTotalGpXCh / semTotalCredits;
    const cumulativeGpXCh = prevTotalGpXCh + semTotalGpXCh;
    const cumulativeCredits = prevTotalCredits + semTotalCredits;
    const newCgpa = cumulativeGpXCh / cumulativeCredits;

    return {
    semGpa,
    newCgpa,
    prevTotalCredits,
    prevTotalGpXCh,
    semTotalCredits,
    highestCreditCourse
    };
}

// Event listener for the main calculate button
calculateBtn.addEventListener('click', () => {
    const result = performCalculations();

    if (result.error) {
    showMessage("Input Error", result.error);
    return;
    }

    semGpaResult.textContent = result.semGpa.toFixed(2);
    cgpaResult.textContent = result.newCgpa.toFixed(2);

    // Calculate required semester GPA for target
    const targetCgpa = parseFloat(targetCgpaInput.value);
    if (!isNaN(targetCgpa)) {
    if (result.prevTotalCredits === 0) {
        requiredGpaResult.textContent = 'N/A';
        insightsText.textContent = "To set a target, you must enter at least one past semester's data. Your target CGPA is equal to the GPA you need this semester.";
    } else {
        const requiredTotalGpXCh = targetCgpa * (result.prevTotalCredits + result.semTotalCredits);
        const requiredSemGpXCh = requiredTotalGpXCh - result.prevTotalGpXCh;
        const requiredGpa = requiredSemGpXCh / result.semTotalCredits;

        if (requiredGpa > 4.0 || requiredGpa < 0) {
        if (result.newCgpa >= targetCgpa) {
            requiredGpaResult.textContent = 'Achieved!';
            insightsText.textContent = `Congratulations! 🎉 Your current grades already exceed your target CGPA of ${targetCgpa.toFixed(2)}. Focus on acing your highest credit-hour courses, like '${result.highestCreditCourse.name}'.`;
        } else {
            requiredGpaResult.textContent = 'Impossible';
            insightsText.textContent = `Based on your current credit hours, it is mathematically impossible to reach your target CGPA of ${targetCgpa.toFixed(2)}. However, you can still improve your CGPA by performing well in your high-credit courses like '${result.highestCreditCourse.name}'.`;
        }
        } else {
        requiredGpaResult.textContent = requiredGpa.toFixed(2);
        insightsText.textContent = `To achieve your target CGPA of ${targetCgpa.toFixed(2)}, you must have a semester GPA of at least ${requiredGpa.toFixed(2)}. Focus your efforts on your highest credit-hour courses, such as '${result.highestCreditCourse.name}'.`;
        }
    }
    } else {
    requiredGpaResult.textContent = '--';
    if (result.highestCreditCourse.name) {
        insightsText.textContent = `To significantly boost your CGPA, focus your effort on getting a great grade in '${result.highestCreditCourse.name}', as it has the highest credit hours (${result.highestCreditCourse.credits}).`;
    } else {
        insightsText.textContent = `To maximize your CGPA, ensure you do well in all your courses. Every grade counts!`;
    }
    }

    // Generate projections
    if (result.prevTotalCredits > 0) {
    projectionsSection.classList.remove('hidden');
    const futureCredits = result.semTotalCredits;
    const calculateProjectedCgpa = (futureGpa) => {
        const futureGpXCh = futureGpa * futureCredits;
        const totalGpXCh = result.prevTotalGpXCh + futureGpXCh;
        const totalCredits = result.prevTotalCredits + futureCredits;
        return (totalGpXCh / totalCredits).toFixed(2);
    };

    proj25Result.textContent = calculateProjectedCgpa(2.5);
    proj30Result.textContent = calculateProjectedCgpa(3.0);
    proj35Result.textContent = calculateProjectedCgpa(3.5);
    proj40Result.textContent = calculateProjectedCgpa(4.0);
    } else {
    projectionsSection.classList.add('hidden');
    }

    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
});

// Event listener for the "What If" button
whatIfBtn.addEventListener('click', () => {
    const result = performCalculations();

    if (result.error) {
    showMessage("Input Error", result.error);
    return;
    }

    whatIfSemGpa.textContent = result.semGpa.toFixed(2);
    whatIfCgpa.textContent = result.newCgpa.toFixed(2);
    whatIfResults.classList.remove('hidden');
    whatIfResults.scrollIntoView({ behavior: 'smooth' });
});