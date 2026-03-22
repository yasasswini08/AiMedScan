const axios = require("axios");

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const BEDROCK_MODEL = "anthropic.claude-3-haiku-20240307-v1:0";

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
async function analyzeWithVision(imageBuffer, mimeType = "image/jpeg") {
  const apiKey = process.env.BEDROCK_API_KEY;
  const region = process.env.BEDROCK_REGION || "us-east-1";

  if (!apiKey || apiKey.trim() === "") {
    console.warn("[vision] BEDROCK_API_KEY not set — Vision analysis unavailable.");
    return null;
  }

  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
    console.warn("[vision] No valid image buffer provided.");
    return null;
  }

  const validMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const safeMime   = validMimes.includes(mimeType) ? mimeType : "image/jpeg";
  const base64     = imageBuffer.toString("base64");

  console.log(`[vision] Sending ${Math.round(base64.length / 1024)} KB image to ${BEDROCK_MODEL} (${safeMime})...`);

  const url = `https://bedrock-runtime.${region}.amazonaws.com/model/${BEDROCK_MODEL}/invoke`;

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens:        4096,
    temperature:       0.1,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type:       "base64",
            media_type: safeMime,
            data:       base64,
          },
        },
        {
          type: "text",
          text: VISION_PROMPT,
        },
      ],
    }],
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Accept":        "application/json",
      },
      timeout: 60000,
    });

    const rawContent = response.data?.content?.[0]?.text;

    if (!rawContent) {
      console.error("[vision] Empty response from Bedrock.");
      console.error("[vision] Full response:", JSON.stringify(response.data, null, 2));
      return null;
    }

    console.log("[vision] Raw Bedrock response:", rawContent.slice(0, 300), "...");

    const parsed = safeParseVisionResponse(rawContent);
    if (!parsed) {
      console.error("[vision] Failed to parse Bedrock JSON response.");
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
      const errMsg = err.response.data?.message || "Unknown API error";
      if (status === 400) console.error("[vision] ❌ Bad request:", errMsg);
      else if (status === 401 || status === 403) console.error("[vision] ❌ Invalid or expired Bedrock API key:", errMsg);
      else if (status === 429) console.error("[vision] ❌ Rate limit exceeded — retry after a moment:", errMsg);
      else if (status === 404) console.error("[vision] ❌ Model not found — check model ID and region:", errMsg);
      else console.error(`[vision] ❌ Bedrock API error ${status}:`, errMsg);
    } else if (err.code === "ECONNABORTED") {
      console.error("[vision] ❌ Bedrock API timed out after 60 seconds.");
    } else {
      console.error("[vision] ❌ Unexpected error:", err.message);
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Response Parser
// ─────────────────────────────────────────────────────────────────────────────
function safeParseVisionResponse(raw) {
  if (!raw || typeof raw !== "string") return null;

  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  const firstBrace = text.indexOf("{");
  const lastBrace  = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") return null;

    if (!Array.isArray(parsed.medicines)) parsed.medicines = [];

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
  VISION_MODEL: BEDROCK_MODEL,
};
