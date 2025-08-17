// ai.js
// Simple AI section that extracts trimester summaries from pasted text via Gemini

const pastTriText = document.getElementById('past-tri-text');
const extractTriBtn = document.getElementById('extract-tri-btn');
const extractTriStatus = document.getElementById('extract-tri-status');

// API config (you can secure/rotate this as needed)
const GEMINI_API_KEY = "AIzaSyBB476jafxuZ0LbQaboaiEoKpB0U4bK0Co";
const GEMINI_MODEL = "gemini-2.5-flash-preview-05-20";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

function showMessage(title, content) {
  const box = document.getElementById('message-box');
  document.getElementById('message-title').textContent = title;
  document.getElementById('message-content').textContent = content;
  box.classList.remove('hidden'); box.classList.add('flex');
}
document.getElementById('message-close-btn')?.addEventListener('click', () => {
  const box = document.getElementById('message-box');
  box.classList.remove('flex'); box.classList.add('hidden');
});

// We rely on window.createSemesterRow defined in application.js
extractTriBtn?.addEventListener('click', async () => {
  const text = pastTriText.value.trim();
  if (!text) { showMessage("Input Required", "Please paste transcript text first."); return; }

  extractTriBtn.disabled = true;
  extractTriStatus.textContent = "Extracting…";

  try {
    const triPrompt = `Extract past trimester/semester summaries from the transcript text.

Return a JSON array. Each item MUST have:
- "name" (string): a label like "Trimester 2 2024/2025" or "Semester 1 2024"
- "gpa" (number)
- "credits" (number)
- "endDate" (string, ISO date YYYY-MM-DD if inferred; else null)

Only include term summaries (not course rows).

Transcript:
"""
${text}
"""`;

    const payload = {
      contents: [{ role: "user", parts: [{ text: triPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              gpa: { type: "NUMBER" },
              credits: { type: "NUMBER" },
              endDate: { type: "STRING" }
            }
          }
        }
      }
    };

    const resp = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error(`Model call failed: ${resp.status}`);

    const result = await resp.json();
    const jsonString = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!jsonString) throw new Error("Model returned no JSON.");

    let terms = JSON.parse(jsonString);
    if (!Array.isArray(terms)) throw new Error("Model output was not an array.");

    // Filter to last 12 months if endDate present
    const now = new Date();
    const cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    terms = terms.filter(t => {
      if (t?.endDate) {
        const d = new Date(t.endDate);
        return !isNaN(d) ? d >= cutoff : true;
      }
      return true;
    });

    // Append to Past Semesters (do not clear)
    const addRow = window.createSemesterRow;
    terms.forEach(t => {
      const name = t?.name || "Trimester/Semester";
      const gpa = (typeof t?.gpa === "number" ? t.gpa.toFixed(2) : "");
      const credits = (typeof t?.credits === "number" ? t.credits : "");
      addRow?.(name, gpa, credits);
    });

    extractTriStatus.textContent = terms.length ? `Added ${terms.length} term(s).` : 'No terms added.';
  } catch (err) {
    console.error(err);
    extractTriStatus.textContent = '';
    showMessage("Extraction Failed", "We couldn’t extract trimester summaries. Try pasting the section that includes term GPA + total credits.");
  } finally {
    extractTriBtn.disabled = false;
  }
});
