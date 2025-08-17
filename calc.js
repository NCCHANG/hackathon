import { selectors, showMessage } from './ui.js';

export const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0,
    'F': 0.0
};

export function performCalculations() {
    let prevTotalGpXCh = 0;
    let prevTotalCredits = 0;
    const semesterRows = document.querySelectorAll('.semester-row');
    for (const row of semesterRows) {
        const gpa = parseFloat(row.querySelector('.sem-gpa').value);
        const credits = parseFloat(row.querySelector('.sem-credits').value);
        if (isNaN(gpa) || isNaN(credits) || credits <= 0) {
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

        if (isNaN(creditHours) || creditHours <= 0 || !grade) {
            return { error: "Please ensure all current course fields have a valid Credit Hour and a selected Grade." };
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