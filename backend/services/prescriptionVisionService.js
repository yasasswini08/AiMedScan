const axios = require("axios");

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const GEMINI_MODEL   = "gemini-2.5-flash";   // Free tier — current stable model (1.5 & 2.0 retired)
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Structured prompt for maximum extraction accuracy on messy handwriting.
// Returns strict, parseable JSON only.
const VISION_PROMPT = `You are a senior clinical pharmacist with 25 years of experience reading
doctor's handwritten prescriptions, especially from Indian hospitals where Telugu and English are mixed.

Analyze this prescription image and extract ALL medicine names written in it.

Common abbreviations doctors use:
- Tab / T. = Tablet, Cap = Capsule, Inj = Injection, Syr = Syrup, Oint = Ointment
- bd / BD = twice daily, tds / TDS = three times daily, od / OD = once daily
- sos / SOS = as needed, hs = bedtime, ac = before food, pc = after food

Extract every medicine you can identify, even if the handwriting is messy.
Use your clinical knowledge to interpret partially legible names.
Do NOT include patient name, doctor name, vitals (BP, SPO2, PR, WT), dates, or diagnosis.
Skip the Telugu letterhead at the top — focus only on the Rx medicine list.

Return ONLY a valid JSON object — no markdown, no code blocks, no extra text:
{
  "medicines": [
    {
      "name": "exact medicine name as written",
      "normalizedName": "standard medicine name (your best interpretation)",
      "dosage": "dosage as written (e.g. 500mg, 250mg)",
      "frequency": "frequency if visible (e.g. bd, tds, od)",
      "duration": "duration if visible (e.g. 5 days, 1 week)",
      "confidence": "high | medium | low"
    }
  ],
  "prescriptionType": "printed | handwritten | mixed",
  "notes": "any relevant clinical note visible on the prescription"
}

If no medicines are legible, return:
{"medicines": [], "prescriptionType": "unknown", "notes": "Prescription image unreadable"}`;

// ─────────────────────────────────────────────────────────────────────────────
// Core Vision Analysis Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * analyzeWithVision
 * Sends a prescription image Buffer to Gemini Vision and returns structured
 * medicine data.
 *
 * @param {Buffer} imageBuffer  — raw image bytes from multer memory storage
 * @param {string} mimeType     — e.g. "image/jpeg", "image/png", "image/webp"
 * @returns {Promise<Object|null>}  { medicines[], prescriptionType, notes } or null
 */
async function analyzeWithVision(imageBuffer, mimeType = "image/jpeg") {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    console.warn("[vision] GEMINI_API_KEY not set — Vision analysis unavailable.");
    console.warn("[vision] Get a free key at: https://aistudio.google.com/app/apikey");
    return null;
  }

  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
    console.warn("[vision] No valid image buffer provided.");
    return null;
  }

  // Validate mime type
  const validMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const safeMime   = validMimes.includes(mimeType) ? mimeType : "image/jpeg";

  // Convert buffer to base64
  const base64 = imageBuffer.toString("base64");

  console.log(`[vision] Sending ${Math.round(base64.length / 1024)} KB image to ${GEMINI_MODEL} (${safeMime})...`);

  // Build Gemini API payload
  const payload = {
    contents: [
      {
        parts: [
          {
            text: VISION_PROMPT,
          },
          {
            inline_data: {
              mime_type: safeMime,
              data:      base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature:     0.1,   // Low = deterministic, consistent extraction
      maxOutputTokens: 4096,  // Increased — 1500 caused JSON truncation
    },
  };

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 60000,  // 60 seconds
      }
    );

    // Extract text from Gemini response
    const rawContent = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      console.error("[vision] Empty response from Gemini API.");
      console.error("[vision] Full response:", JSON.stringify(response.data, null, 2));
      return null;
    }

    console.log("[vision] Raw Gemini response:", rawContent.slice(0, 300), "...");

    const parsed = safeParseVisionResponse(rawContent);
    if (!parsed) {
      console.error("[vision] Failed to parse Gemini JSON response.");
      return null;
    }

    const count = parsed.medicines?.length || 0;
    console.log(
      `[vision] Extracted ${count} medicine(s):`,
      (parsed.medicines || []).map(m => `${m.normalizedName || m.name} (${m.confidence})`)
    );

    return parsed;

  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      const errMsg = err.response.data?.error?.message || "Unknown API error";

      if (status === 400) {
        console.error("[vision] ❌ Bad request — check image format or prompt:", errMsg);
      } else if (status === 403) {
        console.error("[vision] ❌ Invalid or missing Gemini API key:", errMsg);
      } else if (status === 429) {
        console.error("[vision] ❌ Gemini rate limit exceeded — wait 60s and retry:", errMsg);
      } else {
        console.error(`[vision] ❌ Gemini API error ${status}:`, errMsg);
      }
    } else if (err.code === "ECONNABORTED") {
      console.error("[vision] ❌ Gemini API timed out after 60 seconds.");
    } else {
      console.error("[vision] ❌ Unexpected error:", err.message);
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Response Parser
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely parse Gemini's response.
 * Handles cases where the model wraps JSON in markdown code blocks.
 */
function safeParseVisionResponse(raw) {
  if (!raw || typeof raw !== "string") return null;

  let text = raw.trim();

  // Strip ```json ... ``` or ``` ... ``` wrappers
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  // Extract just the JSON object
  const firstBrace = text.indexOf("{");
  const lastBrace  = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") return null;

    if (!Array.isArray(parsed.medicines)) {
      parsed.medicines = [];
    }

    parsed.medicines = parsed.medicines
      .filter(m => m && (m.name || m.normalizedName))
      .map(m => ({
        name:           (m.name           || "").trim(),
        normalizedName: (m.normalizedName || m.name || "").trim(),
        dosage:         (m.dosage         || "").trim(),
        frequency:      (m.frequency      || "").trim(),
        duration:       (m.duration       || "").trim(),
        confidence:     (m.confidence     || "medium").toLowerCase(),
      }))
      .filter(m => m.normalizedName.length >= 3);

    return parsed;

  } catch (parseErr) {
    console.error("[vision] JSON parse error:", parseErr.message);
    console.error("[vision] Attempted text:", text.slice(0, 200));
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  analyzeWithVision,
  safeParseVisionResponse,
  VISION_MODEL: GEMINI_MODEL,
};
