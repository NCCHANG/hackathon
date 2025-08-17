import { selectors, showMessage, clearAllInputs, createSemesterRow, createCourseRow } from './ui.js';
import { saveData } from './data.js';
import { setupAuth, userId, appId } from './auth.js';
import { performCalculations, calculatePrevSemestersCGPA } from './calc.js';
import { db } from './firebase.js';

// Setup authentication listeners
setupAuth();

// UI event listeners
selectors.addSemesterBtn.addEventListener('click', () => createSemesterRow());
selectors.addCourseBtn.addEventListener('click', () => createCourseRow());
selectors.saveBtn.addEventListener('click', () => saveData(userId, appId, db));
selectors.clearBtn.addEventListener('click', clearAllInputs);

// --- Transcript Parsing Event ---
selectors.parseTranscriptBtn.addEventListener('click', async () => {
    const text = selectors.transcriptText.value.trim();
    if (text === '') {
        showMessage("Input Required", "Please paste your transcript text into the box first.");
        return;
    }

    // Show loading state
    selectors.parseTranscriptBtn.disabled = true;
    selectors.parseSpinner.classList.remove('hidden');
    selectors.parseText.textContent = 'Parsing...';

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
        selectors.coursesContainer.innerHTML = '';
        parsedCourses.forEach(course => {
            if (course.name && course.credits && course.grade) {
                createCourseRow(course.name, course.credits, course.grade);
            }
        });

        showMessage("Success!", "Courses have been automatically added. Please review the details.");

    } catch (error) {
        console.error("Parsing failed:", error);
        showMessage("Parsing Failed", "There was an error parsing the text. Please ensure the text format is clear and try again, or enter the data manually.");
    } finally {
        selectors.parseTranscriptBtn.disabled = false;
        selectors.parseSpinner.classList.add('hidden');
        selectors.parseText.textContent = 'Parse & Fill Courses';
    }
});

// --- Calculate Button Event ---
selectors.calculateBtn.addEventListener('click', () => {
    const result = performCalculations();

    if (result.error) {
        showMessage("Input Error", result.error);
        return;
    }

    selectors.semGpaResult.textContent = result.semGpa.toFixed(2);
    selectors.cgpaResult.textContent = result.newCgpa.toFixed(2);

    const targetCgpa = parseFloat(selectors.targetCgpaInput.value);
    if (!isNaN(targetCgpa)) {
        if (result.prevTotalCredits === 0) {
            selectors.requiredGpaResult.textContent = 'N/A';
            selectors.insightsText.textContent = "To set a target, you must enter at least one past semester's data. Your target CGPA is equal to the GPA you need this semester.";
        } else {
            const requiredTotalGpXCh = targetCgpa * (result.prevTotalCredits + result.semTotalCredits);
            const requiredSemGpXCh = requiredTotalGpXCh - result.prevTotalGpXCh;
            const requiredGpa = requiredSemGpXCh / result.semTotalCredits;

            if (requiredGpa > 4.0 || requiredGpa < 0) {
                if (result.newCgpa >= targetCgpa) {
                    selectors.requiredGpaResult.textContent = 'Achieved!';
                    selectors.insightsText.textContent = `Congratulations! 🎉 Your current grades already exceed your target CGPA of ${targetCgpa.toFixed(2)}. Focus on acing your highest credit-hour courses, like '${result.highestCreditCourse.name}'.`;
                } else {
                    selectors.requiredGpaResult.textContent = 'Impossible';
                    selectors.insightsText.textContent = `Based on your current credit hours, it is mathematically impossible to reach your target CGPA of ${targetCgpa.toFixed(2)}. However, you can still improve your CGPA by performing well in your high-credit courses like '${result.highestCreditCourse.name}'.`;
                }
            } else {
                selectors.requiredGpaResult.textContent = requiredGpa.toFixed(2);
                selectors.insightsText.textContent = `To achieve your target CGPA of ${targetCgpa.toFixed(2)}, you must have a semester GPA of at least ${requiredGpa.toFixed(2)}. Focus your efforts on your highest credit-hour courses, such as '${result.highestCreditCourse.name}'.`;
            }
        }
    } else {
        selectors.requiredGpaResult.textContent = '--';
        if (result.highestCreditCourse.name) {
            selectors.insightsText.textContent = `To significantly boost your CGPA, focus your effort on getting a great grade in '${result.highestCreditCourse.name}', as it has the highest credit hours (${result.highestCreditCourse.credits}).`;
        } else {
            selectors.insightsText.textContent = `To maximize your CGPA, ensure you do well in all your courses. Every grade counts!`;
        }
    }

    // Projections
    if (result.prevTotalCredits > 0) {
        selectors.projectionsSection.classList.remove('hidden');
        const futureCredits = result.semTotalCredits;
        const calculateProjectedCgpa = (futureGpa) => {
            const futureGpXCh = futureGpa * futureCredits;
            const totalGpXCh = result.prevTotalGpXCh + futureGpXCh;
            const totalCredits = result.prevTotalCredits + futureCredits;
            return (totalGpXCh / totalCredits).toFixed(2);
        };

        selectors.proj25Result.textContent = calculateProjectedCgpa(2.5);
        selectors.proj30Result.textContent = calculateProjectedCgpa(3.0);
        selectors.proj35Result.textContent = calculateProjectedCgpa(3.5);
        selectors.proj40Result.textContent = calculateProjectedCgpa(4.0);
    } else {
        selectors.projectionsSection.classList.add('hidden');
    }

    selectors.resultsSection.classList.remove('hidden');
    selectors.resultsSection.scrollIntoView({ behavior: 'smooth' });
});

// --- What If Button Event ---
selectors.whatIfBtn.addEventListener('click', () => {
    const result = performCalculations();

    if (result.error) {
        showMessage("Input Error", result.error);
        return;
    }

    selectors.whatIfSemGpa.textContent = result.semGpa.toFixed(2);
    selectors.whatIfCgpa.textContent = result.newCgpa.toFixed(2);
    selectors.whatIfResults.classList.remove('hidden');
    selectors.whatIfResults.scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('calc-prev-cgpa-btn').addEventListener('click', () => {
    const result = calculatePrevSemestersCGPA();
    const resultDiv = document.getElementById('prev-cgpa-result');
    if (result.error) {
        resultDiv.textContent = result.error;
        resultDiv.classList.remove('text-blue-700');
        resultDiv.classList.add('text-red-600');
    } else {
        resultDiv.textContent = `CGPA for Past Semesters: ${result.cgpa.toFixed(2)}`;
        resultDiv.classList.remove('text-red-600');
        resultDiv.classList.add('text-blue-700');
    }
});