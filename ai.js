// ai.js — robust AI + local fallback for past trimester extraction (no 12-month filter)

/**
 * Public API used by application.js:
 *   import { extractPastTrimesters } from './ai.js';
 *   const terms = await extractPastTrimesters(text);
 */
const GEMINI_KEY = "AIzaSyBB476jafxuZ0LbQaboaiEoKpB0U4bK0Co"; // your key
const MODEL = "gemini-2.5-flash"; // stable alias

export async function extractPastTrimesters(text) {
  // Try AI first
  try {
    const ai = await tryGeminiExtraction(text);
    if (Array.isArray(ai) && ai.length) {
      return normalizeTerms(ai);
    }
  } catch (e) {
    console.warn("Gemini extraction failed, falling back to regex:", e);
  }
  // Fallback to local parser
  const local = localFallbackParse(text);
  return normalizeTerms(local);
}

/* ----------------------- AI helper ----------------------- */

async function tryGeminiExtraction(text) {
  const prompt = `You are extracting trimester/semester summaries (NOT per-course rows) from university transcript text.

Return ONLY a JSON array (no commentary). Each item must have:
{
  "name": "Semester/Trimester label (human friendly)",
  "gpa": number,
  "credits": number,
  "endDate": "YYYY-MM-DD" | null
}

Include only real term summaries (where the per-term GPA and term credits/hours are present or can be inferred).
When both "Hours" and "Total Hours" appear, "Hours" means the term's credits, while "Total Hours" is cumulative.`;

  const body = {
    contents: [{ role: "user", parts: [{ text: `${prompt}\n\nTranscript:\n\"\"\"\n${text}\n\"\"\"` }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      responseMimeType: "text/plain"
    }
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errTxt = await safeText(res);
    throw new Error(`AI HTTP ${res.status}: ${errTxt}`);
  }

  const json = await res.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const arr = extractFirstJsonArray(raw);
  if (!arr) throw new Error("AI returned no JSON array.");
  return arr;
}

async function safeText(res) {
  try { return await res.text(); } catch { return ""; }
}

/** Extract first JSON array from a possibly chatty answer. */
function extractFirstJsonArray(s) {
  if (!s || typeof s !== "string") return null;
  const cleaned = s.replace(/```json|```/gi, "");
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const candidate = cleaned.slice(start, end + 1);
    const parsed = JSON.parse(candidate);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/* ------------------- Local fallback parser ------------------- */

function localFallbackParse(text) {
  const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  // 1) Headers can be either with a number or with months:
  //    - "Trimester 2 2024/2025"
  //    - "Trimester March/April 2024"
  const HEADER_NUMERIC = /(TRI?MESTER|SEMESTER)\s*([1-3])(?:\s*[,\-:]*)\s*((?:20)?\d{2})(?:\s*\/\s*((?:20)?\d{2}))?/i;
  const HEADER_MONTHS  = /(TRI?MESTER|SEMESTER)\s+([A-Za-z]+(?:\/[A-Za-z]+)?)\s+((?:20)?\d{4})/i;

  // 2) GPA & Credits. Prefer "Hours <n>" as term credits, avoid "Total Hours".
  const GPA_RE   = /\bGPA\s*[:\-]?\s*([0-4](?:\.\d{1,3})?)\b/i;
  const HOURS_RE = /\bHours\s+(\d{1,3})\b/i;           // term credits
  const CRED2_RE = /\b(?:Credits?|Credit\s*Hours|CH)\s*[:\-]?\s*(\d{1,3})\b/i;
  // Note: we intentionally DO NOT use "Total Hours" as term credits.

  // Build blocks
  const blocks = [];
  let current = null;

  for (const ln of lines) {
    const m1 = ln.match(HEADER_NUMERIC);
    const m2 = ln.match(HEADER_MONTHS);

    if (m1 || m2) {
      if (current) blocks.push(current);

      if (m1) {
        const [, kind, num, y1, y2] = m1;
        current = {
          header: ln,
          kind: (kind || '').toUpperCase(),
          num: safeInt(num),
          y1: normalizeYear(y1),
          y2: normalizeYear(y2),
          months: null,
          year: normalizeYear(y2 ? y2 : y1),
          lines: []
        };
      } else {
        const [, kind, months, year] = m2;
        current = {
          header: ln,
          kind: (kind || '').toUpperCase(),
          num: null,
          y1: normalizeYear(year),
          y2: null,
          months: String(months || '').trim(),  // e.g., "March/April"
          year: normalizeYear(year),
          lines: []
        };
      }
    } else if (current) {
      current.lines.push(ln);
    }
  }
  if (current) blocks.push(current);

  // Parse each block for GPA & Credits
  const terms = [];
  for (const b of blocks) {
    let gpa = null, credits = null;

    for (const l of b.lines) {
      if (gpa == null) {
        const g = l.match(GPA_RE);
        if (g) gpa = parseFloat(g[1]);
      }
      if (credits == null) {
        const h = l.match(HOURS_RE);
        if (h) {
          credits = parseInt(h[1], 10);
          continue;
        }
        const c = l.match(CRED2_RE);
        if (c) credits = parseInt(c[1], 10);
      }
    }

    if (!Number.isFinite(credits) || credits <= 0) continue;

    const name = buildName(b);
    const endDate = guessEndDate(b);
    terms.push({ name, gpa: Number.isFinite(gpa) ? gpa : null, credits, endDate });
  }

  // 🚫 No 12-month filter anymore — return all parsed terms
  return terms;
}

function safeInt(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function normalizeYear(y) {
  if (!y) return null;
  const n = String(y);
  if (n.length === 2) return Number("20" + n);
  const num = Number(n);
  return Number.isFinite(num) ? num : null;
}

function buildName(b) {
  if (b.months && b.year) {
    const kind = cap(b.kind);
    return `${kind} ${b.months} ${b.year}`.trim();
  }
  const y = (b.y1 && b.y2) ? `${b.y1}/${b.y2}` : (b.y1 ? `${b.y1}` : 'Unknown Year');
  const kind = cap(b.kind);
  return `${kind} ${b.num || ''} ${y}`.trim();
}

function cap(s) {
  if (!s) return 'Term';
  const low = s.toLowerCase();
  return low.charAt(0).toUpperCase() + low.slice(1);
}

function guessEndDate(b) {
  // If months like "March/April" are present, end date = end of last month
  if (b.months && b.year) {
    const parts = String(b.months).split('/').map(s => s.trim());
    const last = parts[parts.length - 1];
    const m = monthToNumber(last);
    if (m != null) {
      const day = daysInMonth(b.year, m);
      return `${b.year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Academic Y1/Y2 → assume Jul 31 of Y2
  if (b.y1 && b.y2) {
    return `${b.y2}-07-31`;
  }

  // Calendar + trimester number heuristic
  if (b.y1) {
    const y = b.y1;
    if (b.num === 1) return `${y}-04-30`;
    if (b.num === 2) return `${y}-08-31`;
    if (b.num === 3) return `${y}-12-31`;
    return `${y}-12-31`;
  }
  return null;
}

function monthToNumber(name) {
  const map = {
    january:0,february:1,march:2,april:3,may:4,june:5,
    july:6,august:7,september:8,october:9,november:10,december:11
  };
  const k = String(name || '').toLowerCase();
  return map[k] ?? null;
}

function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

/* ------------------- Normalization ------------------- */

function normalizeTerms(arr) {
  return (arr || [])
    .map(t => ({
      name: String(t?.name || 'Trimester/Semester').trim(),
      gpa: toNumOrNull(t?.gpa),
      credits: toIntOrNull(t?.credits),
      endDate: typeof t?.endDate === 'string' ? t.endDate : null
    }))
    .filter(t => Number.isFinite(t.credits) && t.credits > 0);
}

function toNumOrNull(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}
function toIntOrNull(x) {
  const n = parseInt(x, 10);
  return Number.isFinite(n) ? n : null;
}
