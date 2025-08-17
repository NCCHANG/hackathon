import { doc, setDoc, onSnapshot } from './firebase.js';
import { selectors, showMessage, createSemesterRow, createCourseRow } from './ui.js';

export async function saveData(userId, appId, db) {
    if (!userId) {
        showMessage("Authentication Required", "Please log in before saving your data.");
        return;
    }

    const data = {
        targetCgpa: selectors.targetCgpaInput.value,
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

export function loadData(data) {
    selectors.targetCgpaInput.value = '';
    selectors.pastSemestersContainer.innerHTML = '';
    selectors.coursesContainer.innerHTML = '';
    selectors.transcriptText.value = '';
    selectors.resultsSection.classList.add('hidden');
    selectors.projectionsSection.classList.add('hidden');
    selectors.whatIfResults.classList.add('hidden');

    selectors.targetCgpaInput.value = data.targetCgpa || '';

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

export function listenForData(userId, appId, db) {
    const docRef = doc(db, 'artifacts', appId, 'users', userId, 'cgpaData', 'myCgpaData');
    onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            loadData(docSnap.data());
            showMessage("Data Loaded", "Your data has been loaded from the cloud.");
        } else {
            showMessage("Welcome!", "No saved data found. Start by adding your past semesters and courses.");
            loadData({semesters: [], courses: []});
        }
    }, (error) => {
        console.error("Error getting document:", error);
        showMessage("Database Error", "Failed to load data from the cloud. Please check your connection.");
    });
}