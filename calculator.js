// calculator.js

// Expose grade map globally (used by AI too if you compute GPAs from courses)
export const gradePoints = {
    'A+(90-100)': 4.00,
    'A(80-89)': 4.00,
    'A-(79)': 3.93,
    'A-(78)': 3.87,
    'A-(77)': 3.80,
    'A-(76)': 3.73,
    'A-(75)': 3.67,
    'B+(74)': 3.60,
    'B+(73)': 3.53,
    'B+(72)': 3.47,
    'B+(71)': 3.40,
    'B+(70)': 3.33,
    'B(69)': 3.27,
    'B(68)': 3.20,
    'B(67)': 3.13,
    'B(66)': 3.07,
    'B(65)': 3.00,
    'B-(64)': 2.93,
    'B-(63)': 2.87,
    'B-(62)': 2.80,
    'B-(61)': 2.73,
    'B-(60)': 2.67,
    'C+(59)': 2.59,
    'C+(58)': 2.53,
    'C+(57)': 2.46,
    'C+(56)': 2.40,
    'C+(55)': 2.33,
    'C(54)': 2.26,
    'C(53)': 2.20,
    'C(52)': 2.13,
    'C(51)': 2.07,
    'C(50)': 2.00,
    'C-(47-49)': 1.67,
    'D+(44-46)': 1.33,
    'D(40-43)': 1.00,
    'F(0-39)': 0.00,
    'PS(40-100)': null, // Special Pass (no points, just Pass)
    'FL(0-39)': null    // Special Fail (no points, just Fail)
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
    if (creditHours === 2){
        return; // Skip 2-credit courses
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
