// ai.js

// Minimal: only for "past trimesters" text extraction via Gemini (optional).
// Keep your API key server-side in production!

const GEMINI_KEY = "AIzaSyBB476jafxuZ0LbQaboaiEoKpB0U4bK0Co";
const MODEL = "gemini-2.5-flash-preview-05-20";

export async function extractPastTrimesters(text) {
  const prompt = `Extract past trimester/semester summaries from the transcript text.

Return a JSON array. Each item MUST have:
- "name" (string): e.g. "Trimester March/April 2024" or "Semester 2 2024/2025"
- "gpa" (number)
- "credits" (number)
- "endDate" (string YYYY-MM-DD) or null

Only include real trimesters/semesters, not individual course lines.

Transcript:
"""
${text}
"""`;

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            "name": { "type": "STRING" },
            "gpa": { "type": "NUMBER" },
            "credits": { "type": "NUMBER" },
            "endDate": { "type": "STRING" }
          }
        }
      }
    }
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(`AI API error: ${res.status}`);
  const json = await res.json();
  const content = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("AI returned empty content.");
  let arr = JSON.parse(content);
  if (!Array.isArray(arr)) throw new Error("AI output not array.");

  // Filter last 12 months if endDate present
  const now = new Date();
  const cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  arr = arr.filter(t => {
    if (t?.endDate) {
      const d = new Date(t.endDate);
      return isFinite(d) ? d >= cutoff : true;
    }
    return true;
  });

  return arr;
}
