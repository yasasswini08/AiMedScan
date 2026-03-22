const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const BEDROCK_MODEL = "anthropic.claude-3-haiku-20240307-v1:0";

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
 * Sends a prescription image Buffer to AWS Bedrock Claude and returns structured
 * medicine data.
 *
 * @param {Buffer} imageBuffer  — raw image bytes from multer memory storage
 * @param {string} mimeType     — e.g. "image/jpeg", "image/png", "image/webp"
 * @returns {Promise<Object|null>}  { medicines[], prescriptionType, notes } or null
 */
async function analyzeWithVision(imageBuffer, mimeType = "image/jpeg") {
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region    = process.env.AWS_REGION || "us-east-1";

  if (!accessKey || !secretKey) {
    console.warn("[vision] AWS credentials not set — Vision analysis unavailable.");
    console.warn("[vision] Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to your environment variables.");
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

  console.log(`[vision] Sending ${Math.round(base64.length / 1024)} KB image to ${BEDROCK_MODEL} (${safeMime})...`);

  // Build AWS Bedrock client
  const client = new BedrockRuntimeClient({
    region,
    credentials: {
      accessKeyId:     accessKey,
      secretAccessKey: secretKey,
    },
  });

  // Build Claude payload
  const body = JSON.stringify({
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
  });

  try {
    const command = new InvokeModelCommand({
      modelId:     BEDROCK_MODEL,
      contentType: "application/json",
      accept:      "application/json",
      body,
    });

    const response = await client.send(command);

    // Extract text from Bedrock response
    const rawContent = JSON.parse(Buffer.from(response.body).toString())
                         .content?.[0]?.text;

    if (!rawContent) {
      console.error("[vision] Empty response from Bedrock.");
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
    if (err.name === "AccessDeniedException") {
      console.error("[vision] ❌ AWS Access Denied — check IAM permissions for Bedrock.");
    } else if (err.name === "ThrottlingException") {
      console.error("[vision] ❌ Bedrock rate limit exceeded — retry after a moment.");
    } else if (err.name === "ValidationException") {
      console.error("[vision] ❌ Invalid request to Bedrock:", err.message);
    } else if (err.name === "ResourceNotFoundException") {
      console.error("[vision] ❌ Model not found — check model ID and region:", err.message);
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
 * Safely parse Bedrock's response.
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
  VISION_MODEL: BEDROCK_MODEL,
};
