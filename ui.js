export const selectors = {
    authSection: document.getElementById('auth-section'),
    emailInput: document.getElementById('email-input'),
    passwordInput: document.getElementById('password-input'),
    signupBtn: document.getElementById('signup-btn'),
    loginBtn: document.getElementById('login-btn'),
    authStatus: document.getElementById('auth-status'),
    calculatorUi: document.getElementById('calculator-ui'),
    userInfoSpan: document.getElementById('user-info'),
    logoutBtn: document.getElementById('logout-btn'),
    parseTranscriptBtn: document.getElementById('parse-transcript-btn'),
    transcriptText: document.getElementById('transcript-text'),
    parseSpinner: document.getElementById('parse-spinner'),
    parseText: document.getElementById('parse-text'),
    
    pastSemestersContainer: document.getElementById('past-semesters-container'),
    addSemesterBtn: document.getElementById('add-semester-btn'),
    targetCgpaInput: document.getElementById('target-cgpa'),
    coursesContainer: document.getElementById('courses-container'),
    addCourseBtn: document.getElementById('add-course-btn'),
    calculateBtn: document.getElementById('calculate-btn'),
    saveBtn: document.getElementById('save-btn'),
    clearBtn: document.getElementById('clear-btn'),
    whatIfBtn: document.getElementById('what-if-btn'),
    whatIfResults: document.getElementById('what-if-results'),
    whatIfSemGpa: document.getElementById('what-if-sem-gpa'),
    whatIfCgpa: document.getElementById('what-if-cgpa'),
   
    resultsSection: document.getElementById('results-section'),
    semGpaResult: document.getElementById('sem-gpa-result'),
    cgpaResult: document.getElementById('cgpa-result'),
    requiredGpaResult: document.getElementById('required-gpa-result'),
    insightsText: document.getElementById('insights-text'),
    projectionsSection: document.getElementById('projections-section'),
    proj25Result: document.getElementById('proj-25-result'),
    proj30Result: document.getElementById('proj-30-result'),
    proj35Result: document.getElementById('proj-35-result'),
    proj40Result: document.getElementById('proj-40-result'),
    messageBox: document.getElementById('message-box'),
    messageTitle: document.getElementById('message-title'),
    messageContent: document.getElementById('message-content'),
    messageCloseBtn: document.getElementById('message-close-btn')
};

export function showMessage(title, content) {
    selectors.messageTitle.textContent = title;
    selectors.messageContent.textContent = content;
    selectors.messageBox.classList.remove('hidden');
    selectors.messageBox.classList.add('flex');
}

export function clearAllInputs() {
    selectors.pastSemestersContainer.innerHTML = '';
    selectors.coursesContainer.innerHTML = '';
    selectors.targetCgpaInput.value = '';
    selectors.transcriptText.value = '';
    selectors.resultsSection.classList.add('hidden');
    selectors.projectionsSection.classList.add('hidden');
    selectors.whatIfResults.classList.add('hidden');
}

export function createSemesterRow(semName = '', semGpa = '', semCredits = '') {
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
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd"></path></svg>
            </button>
        </div>
    `;
    selectors.pastSemestersContainer.appendChild(semesterRow);
    semesterRow.querySelector('.remove-semester-btn').addEventListener('click', () => {
        selectors.pastSemestersContainer.removeChild(semesterRow);
    });
}

export function createCourseRow(courseName = '', creditHours = '', grade = '') {
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
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd"></path></svg>
            </button>
        </div>
    `;
    selectors.coursesContainer.appendChild(courseRow);
    courseRow.querySelector('.remove-course-btn').addEventListener('click', () => {
        selectors.coursesContainer.removeChild(courseRow);
    });
}

// Message box close event
selectors.messageCloseBtn.addEventListener('click', () => {
    selectors.messageBox.classList.remove('flex');
    selectors.messageBox.classList.add('hidden');
});