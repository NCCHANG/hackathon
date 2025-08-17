// calculator.js

// Expose grade map globally (used by AI too if you compute GPAs from courses)
export const gradePoints = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0,
  'F': 0.0
};

// Main calculation — depends on DOM inputs created in application.js
export function performCalculations() {
  let prevTotalGpXCh = 0;
  let prevTotalCredits = 0;

  // Past semesters
  document.querySelectorAll('.semester-row').forEach(row => {
    const gpa = parseFloat(row.querySelector('.sem-gpa').value);
    const credits = parseFloat(row.querySelector('.sem-credits').value);

    if (credits === 0) return; // allow 0 rows without error
    if (isNaN(gpa) || isNaN(credits) || !(credits > 0)) {
      throw new Error("Please ensure all past semester fields have a valid GPA and Credits.");
    }

    prevTotalGpXCh += gpa * credits;
    prevTotalCredits += credits;
  });

  // Current courses
  const courseRows = document.querySelectorAll('.course-row');
  if (courseRows.length === 0) {
    throw new Error("Please add at least one current course.");
  }

  let semTotalGpXCh = 0;
  let semTotalCredits = 0;
  let highestCreditCourse = { name: null, credits: 0 };

  courseRows.forEach(row => {
    const creditHours = parseFloat(row.querySelector('.credit-hours').value);
    const grade = row.querySelector('.grade-input').value;
    const courseName = row.querySelector('.course-name').value || "This Course";

    if (creditHours === 0) return; // allow 0-credit courses
    if (isNaN(creditHours) || !grade) {
      throw new Error("Please enter a valid number for credit hours (>= 0) and select a grade for each course.");
    }

    const gp = gradePoints[grade];
    semTotalGpXCh += gp * creditHours;
    semTotalCredits += creditHours;

    if (creditHours > highestCreditCourse.credits) {
      highestCreditCourse.credits = creditHours;
      highestCreditCourse.name = courseName;
    }
  });

  const semGpa = semTotalCredits > 0 ? (semTotalGpXCh / semTotalCredits) : 0;
  const cumulativeGpXCh = prevTotalGpXCh + semTotalGpXCh;
  const cumulativeCredits = prevTotalCredits + semTotalCredits;
  const newCgpa = cumulativeCredits > 0 ? (cumulativeGpXCh / cumulativeCredits) : 0;

  return {
    semGpa,
    newCgpa,
    prevTotalCredits,
    prevTotalGpXCh,
    semTotalCredits,
    highestCreditCourse
  };
}
