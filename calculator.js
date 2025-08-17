// calculator.js

// === Grade map (your updated mapping) ===
export const gradePoints = {
  'A+(90-100)': 4.00,
  'A(80-89)': 4.00,
  'A-(79)': 3.93, 'A-(78)': 3.87, 'A-(77)': 3.80, 'A-(76)': 3.73, 'A-(75)': 3.67,
  'B+(74)': 3.60, 'B+(73)': 3.53, 'B+(72)': 3.47, 'B+(71)': 3.40, 'B+(70)': 3.33,
  'B(69)': 3.27, 'B(68)': 3.20, 'B(67)': 3.13, 'B(66)': 3.07, 'B(65)': 3.00,
  'B-(64)': 2.93, 'B-(63)': 2.87, 'B-(62)': 2.80, 'B-(61)': 2.73, 'B-(60)': 2.67,
  'C+(59)': 2.59, 'C+(58)': 2.53, 'C+(57)': 2.46, 'C+(56)': 2.40, 'C+(55)': 2.33,
  'C(54)': 2.26, 'C(53)': 2.20, 'C(52)': 2.13, 'C(51)': 2.07, 'C(50)': 2.00,
  'C-(47-49)': 1.67,
  'D+(44-46)': 1.33,
  'D(40-43)': 1.00,
  'F(0-39)': 0.00,
  'PS(40-100)': null,
  'FL(0-39)': null
};

// === Math helpers ===
const EPS = 1e-6;
export const GPA_CAP = 4.0;

export function performCalculationsFromDOM() {
  // Past semesters
  let prevTotalGpXCh = 0;
  let prevTotalCredits = 0;
  document.querySelectorAll('.semester-row').forEach(row => {
    const gpa = parseFloat(row.querySelector('.sem-gpa')?.value);
    const credits = parseFloat(row.querySelector('.sem-credits')?.value);
    if (!isFinite(credits) || credits < 0) return;
    if (credits === 0) return;
    if (!isFinite(gpa)) throw new Error("Invalid past semester GPA/credits.");
    prevTotalGpXCh += gpa * credits;
    prevTotalCredits += credits;
  });

  // Current courses
  let semTotalGpXCh = 0;
  let semTotalCredits = 0;
  let highestCreditCourse = { name: null, credits: 0 };

  const courseRows = document.querySelectorAll('.course-row');
  if (courseRows.length === 0) {
    throw new Error("Please add at least one current course.");
  }

  courseRows.forEach(row => {
    const creditHours = parseFloat(row.querySelector('.credit-hours')?.value);
    const grade = row.querySelector('.grade-input')?.value;
    const courseName = (row.querySelector('.course-name')?.value || "This Course").trim();
    if (!isFinite(creditHours) || creditHours < 0) return;
    if (creditHours === 0) return;
    if(creditHours === 2) {return;} // Skip 2-credit courses
    if (!grade) throw new Error("Missing grade for a course.");
    const gp = simpleLetterToPoint(grade);
    if (!isFinite(gp)) throw new Error("Invalid grade mapping.");

    semTotalGpXCh += gp * creditHours;
    semTotalCredits += creditHours;

    if (creditHours > highestCreditCourse.credits) {
      highestCreditCourse = { name: courseName, credits: creditHours };
    }
  });

  const semGpa = semTotalCredits > 0 ? (semTotalGpXCh / semTotalCredits) : NaN;
  const cumulativeGpXCh = prevTotalGpXCh + semTotalGpXCh;
  const cumulativeCredits = prevTotalCredits + semTotalCredits;
  const newCgpa = cumulativeCredits > 0 ? (cumulativeGpXCh / cumulativeCredits) : NaN;

  return {
    semGpa,
    newCgpa,
    prevTotalCredits,
    prevTotalGpXCh,
    semTotalCredits,
    highestCreditCourse
  };
}

// Basic letter mapping (A+, A, A-, ... F)
export function simpleLetterToPoint(letter) {
  // default classic scale; adjust if you want to use your fine-grained map
  const map = {
    'A+(90-100)': 4.00,
  'A(80-89)': 4.00,
  'A-(79)': 3.93, 'A-(78)': 3.87, 'A-(77)': 3.80, 'A-(76)': 3.73, 'A-(75)': 3.67,
  'B+(74)': 3.60, 'B+(73)': 3.53, 'B+(72)': 3.47, 'B+(71)': 3.40, 'B+(70)': 3.33,
  'B(69)': 3.27, 'B(68)': 3.20, 'B(67)': 3.13, 'B(66)': 3.07, 'B(65)': 3.00,
  'B-(64)': 2.93, 'B-(63)': 2.87, 'B-(62)': 2.80, 'B-(61)': 2.73, 'B-(60)': 2.67,
  'C+(59)': 2.59, 'C+(58)': 2.53, 'C+(57)': 2.46, 'C+(56)': 2.40, 'C+(55)': 2.33,
  'C(54)': 2.26, 'C(53)': 2.20, 'C(52)': 2.13, 'C(51)': 2.07, 'C(50)': 2.00,
  'C-(47-49)': 1.67,
  'D+(44-46)': 1.33,
  'D(40-43)': 1.00,
  'F(0-39)': 0.00,
  'PS(40-100)': null,
  'FL(0-39)': null
  };
  return map[(letter || '').toUpperCase()];
}

// Compute required semester GPA to hit a target CGPA after this term
export function computeRequiredGpa(target, prevTotalGpXCh, prevTotalCredits, semTotalCredits, newCgpaPredict) {
  if (!isFinite(target)) return { status: 'no-target' };
  if ((prevTotalCredits || 0) === 0) return { status: 'no-history' };
  if ((semTotalCredits || 0) === 0) return { status: 'no-sem-credits' };

  const requiredTotalQ = target * (prevTotalCredits + semTotalCredits);
  const requiredSemQ = requiredTotalQ - prevTotalGpXCh;
  let requiredGpa = requiredSemQ / semTotalCredits;

  if (Math.abs(requiredGpa) < EPS) requiredGpa = 0;
  if (Math.abs(requiredGpa - GPA_CAP) < EPS) requiredGpa = GPA_CAP;

  if (isFinite(newCgpaPredict) && newCgpaPredict + EPS >= target) {
    return { status: 'achieved' };
  }

  if (requiredGpa >= -EPS && requiredGpa <= GPA_CAP + EPS) {
    requiredGpa = Math.max(0, Math.min(GPA_CAP, requiredGpa));
    return { status: 'ok', value: requiredGpa };
  }

  // impossible this term — estimate extra credits at cap
  let extraCredits = null;
  if (GPA_CAP > target + EPS) {
    const rhs = (target * (prevTotalCredits + semTotalCredits)) - prevTotalGpXCh - (GPA_CAP * semTotalCredits);
    const denom = (GPA_CAP - target);
    const x = rhs / denom;
    if (isFinite(x) && x > 0) extraCredits = Math.ceil(x);
  }
  return { status: 'impossible', extraCredits };
}

// === Projection helpers ===
export function predictCgpa(prevTotalGpXCh, prevTotalCredits, semTotalCredits, hypoGpa) {
  const Cp = Number(prevTotalCredits || 0);
  const Qp = Number(prevTotalGpXCh || 0);
  const Cs = Number(semTotalCredits || 0);
  if (Cs <= 0) return NaN;
  const totalQ = Qp + hypoGpa * Cs;
  const totalC = Cp + Cs;
  return totalC > 0 ? (totalQ / totalC) : NaN;
}

export function predictCgpaForGpaList(calcResult, gpaList = [2.0, 2.5, 3.0, 3.5, 4.0]) {
  const out = {};
  for (const g of gpaList) {
    out[g] = predictCgpa(
      calcResult.prevTotalGpXCh,
      calcResult.prevTotalCredits,
      calcResult.semTotalCredits,
      g
    );
  }
  return out;
}
