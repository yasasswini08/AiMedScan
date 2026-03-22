require("dotenv").config();
const { analyzeWithVision } = require("../services/prescriptionVisionService");

// ══════════════════════════════════════════════════════════════════════════════
// ALLOWED FILE TYPES
// ══════════════════════════════════════════════════════════════════════════════
const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png",
  "image/webp", "image/tiff", "image/heic", "image/heif", "application/pdf",
]);

// ══════════════════════════════════════════════════════════════════════════════
// MEDICINE DATABASE
// ══════════════════════════════════════════════════════════════════════════════
const MEDICINE_DB = {
  // ── Analgesics / Antipyretics ──────────────────────────────────────────────
  paracetamol:    { name:"Paracetamol",      category:"Analgesic / Antipyretic",         purpose:"Relieves mild-moderate pain and reduces fever.",                                             dosage:"500–1000 mg every 4–6 h. Max 4000 mg/day.",          sideEffects:["Nausea at high doses","Liver toxicity if overdosed"],                     precautions:["Do not exceed 4000 mg/day","Avoid alcohol","Check other medicines for hidden paracetamol"], requiresPrescription:false },
  ibuprofen:      { name:"Ibuprofen",        category:"NSAID",                            purpose:"Pain, fever and inflammation relief.",                                                       dosage:"200–400 mg every 4–6 h with food. Max 1200 mg/day.", sideEffects:["Stomach irritation","GI bleeding risk","Kidney impairment"],               precautions:["Take with food","Avoid with ulcers or kidney disease"],                                      requiresPrescription:false },
  diclofenac:     { name:"Diclofenac",       category:"NSAID",                            purpose:"Moderate-to-severe pain and inflammation.",                                                  dosage:"50 mg 2–3 times daily with food.",                    sideEffects:["GI irritation","Elevated liver enzymes"],                                 precautions:["Take with food","Avoid in pregnancy","Avoid with heart disease"],                           requiresPrescription:true  },
  aspirin:        { name:"Aspirin",          category:"NSAID / Antiplatelet",             purpose:"Pain, fever. Low-dose: antiplatelet for cardiac prevention.",                               dosage:"Pain: 300–600 mg every 4–6 h. Cardiac: 75–100 mg/day.", sideEffects:["Stomach irritation","GI bleeding"],                                    precautions:["NOT for children under 16","Avoid with ulcers"],                                            requiresPrescription:false },
  tramadol:       { name:"Tramadol",         category:"Opioid Analgesic",                 purpose:"Moderate to severe pain relief.",                                                            dosage:"50–100 mg every 4–6 h. Max 400 mg/day.",              sideEffects:["Nausea","Dizziness","Drowsiness","Risk of dependence"],                   precautions:["Do not drive","Risk of dependence — use short term only","Avoid alcohol"],                  requiresPrescription:true  },

  // ── Antibiotics ────────────────────────────────────────────────────────────
  amoxicillin:    { name:"Amoxicillin",      category:"Antibiotic (Penicillin)",          purpose:"Bacterial infections — ear, throat, chest, urinary tract, dental.",                         dosage:"250–500 mg every 8 h.",                               sideEffects:["Diarrhoea","Nausea","Rash"],                                              precautions:["Complete full course","Check for penicillin allergy"],                                       requiresPrescription:true  },
  azithromycin:   { name:"Azithromycin",     category:"Antibiotic (Macrolide)",           purpose:"Respiratory, ear, skin infections.",                                                         dosage:"500 mg Day 1, then 250 mg Days 2–5.",                 sideEffects:["Nausea","Diarrhoea"],                                                     precautions:["Complete full course","Avoid antacids within 2 h"],                                         requiresPrescription:true  },
  metronidazole:  { name:"Metronidazole",    category:"Antibiotic / Antiprotozoal",       purpose:"Gut infections, dental abscesses, pelvic infections.",                                      dosage:"200–500 mg 2–3 times daily.",                         sideEffects:["Metallic taste","Nausea","Dark urine (harmless)"],                        precautions:["STRICTLY avoid alcohol during and 48 h after course","Complete full course"],               requiresPrescription:true  },
  ciprofloxacin:  { name:"Ciprofloxacin",    category:"Antibiotic (Fluoroquinolone)",     purpose:"UTIs, respiratory, skin and GI infections.",                                                dosage:"250–750 mg twice daily.",                             sideEffects:["Nausea","Sun sensitivity","Rare: tendon damage"],                         precautions:["Avoid sunlight","Complete full course","Not for under 18"],                                 requiresPrescription:true  },
  doxycycline:    { name:"Doxycycline",      category:"Antibiotic (Tetracycline)",        purpose:"Chest infections, malaria prevention, acne.",                                               dosage:"100 mg twice daily.",                                 sideEffects:["Nausea","Sun sensitivity"],                                               precautions:["Take with full glass of water","Avoid sun","Not for under 8 or pregnant"],                  requiresPrescription:true  },
  cephalexin:     { name:"Cephalexin",       category:"Antibiotic (Cephalosporin)",       purpose:"Skin, ear, urinary, and bone infections.",                                                  dosage:"250–500 mg every 6 h.",                               sideEffects:["Diarrhoea","Nausea"],                                                     precautions:["Inform doctor of penicillin allergy","Complete full course"],                               requiresPrescription:true  },
  clindamycin:    { name:"Clindamycin",      category:"Antibiotic (Lincosamide)",         purpose:"Skin, soft tissue, bone and dental infections.",                                             dosage:"150–450 mg every 6 h.",                               sideEffects:["Diarrhoea — risk of C. difficile","Nausea"],                              precautions:["Stop if severe diarrhoea develops","Complete full course"],                                 requiresPrescription:true  },

  // ── Haemostatics ──────────────────────────────────────────────────────────
  tranexamic:     { name:"Tranexamic Acid",  category:"Haemostatic / Antifibrinolytic",   purpose:"Prevents and treats excessive bleeding — post-surgery, heavy menstrual bleeding, trauma.", dosage:"250–500 mg 3 times daily (oral). As prescribed.",     sideEffects:["Nausea","Vomiting","Diarrhoea","Rare: thrombosis"],                       precautions:["Not for patients with history of blood clots","Monitor for vision changes"],               requiresPrescription:true  },

  // ── Iron / Haematinics ────────────────────────────────────────────────────
  ferroussulfate: { name:"Ferrous Sulfate",  category:"Iron Supplement",                  purpose:"Iron deficiency anaemia — raises haemoglobin levels.",                                      dosage:"200 mg (60 mg elemental iron) 1–3 times daily.",      sideEffects:["Constipation","Black stools (harmless)","Nausea"],                        precautions:["Take on empty stomach","Vitamin C improves absorption","Avoid within 2 h of antacids"],     requiresPrescription:false },
  ironfolate:     { name:"Iron + Folic Acid",category:"Haematinic Supplement",            purpose:"Iron deficiency anaemia with folic acid supplementation.",                                  dosage:"1 tablet daily with food.",                           sideEffects:["Constipation","Nausea","Black stools (harmless)"],                        precautions:["Take regularly as prescribed","Vitamin C enhances absorption"],                             requiresPrescription:false },

  // ── Vitamins / Supplements ────────────────────────────────────────────────
  vitaminb12:     { name:"Vitamin B12",      category:"Vitamin / Supplement",             purpose:"B12 deficiency — supports nerve function, red blood cell production.",                      dosage:"500–1000 mcg daily or as prescribed.",                sideEffects:["Generally very safe","Rare: acne with high doses"],                       precautions:["Regular monitoring if pernicious anaemia"],                                                 requiresPrescription:false },
  folicacid:      { name:"Folic Acid",       category:"Vitamin B9 Supplement",            purpose:"Folic acid deficiency, anaemia, and essential in pregnancy.",                               dosage:"400–5000 mcg daily depending on indication.",         sideEffects:["Generally very safe at recommended doses"],                               precautions:["Essential in pregnancy","Do not take megadoses without medical advice"],                    requiresPrescription:false },
  calciumvitamind:{ name:"Calcium + Vit D",  category:"Calcium / Bone Supplement",        purpose:"Calcium and Vitamin D supplementation for bone health.",                                    dosage:"500–1000 mg calcium + 400–800 IU Vit D once or twice daily.", sideEffects:["Constipation","Nausea","Rare: hypercalcaemia with excess"],          precautions:["Take with food","Separate from iron by 2 h"],                                               requiresPrescription:false },
  vitamind:       { name:"Vitamin D3",       category:"Vitamin / Supplement",             purpose:"Vitamin D deficiency — supports calcium absorption, bone and immune health.",               dosage:"1000–4000 IU daily or high-dose weekly as prescribed.",sideEffects:["Generally safe","Toxicity with overuse: nausea, weakness"],                precautions:["Take with a fatty meal","Do not exceed prescribed dose"],                                   requiresPrescription:false },

  // ── GI / Antacids ─────────────────────────────────────────────────────────
  omeprazole:     { name:"Omeprazole",       category:"Proton Pump Inhibitor (PPI)",      purpose:"Reduces stomach acid — GERD, ulcers, heartburn.",                                           dosage:"20 mg once daily 30–60 min before breakfast.",        sideEffects:["Headache","Nausea","Reduced magnesium long-term"],                        precautions:["Take before meals","Do not crush capsules"],                                                requiresPrescription:false },
  pantoprazole:   { name:"Pantoprazole",     category:"Proton Pump Inhibitor (PPI)",      purpose:"Reduces stomach acid — GERD, ulcers.",                                                      dosage:"40 mg once daily before breakfast.",                  sideEffects:["Headache","Diarrhoea","Nausea"],                                          precautions:["Take before meals"],                                                                        requiresPrescription:false },
  ondansetron:    { name:"Ondansetron",      category:"Anti-Emetic",                      purpose:"Prevention and treatment of nausea and vomiting.",                                          dosage:"4–8 mg 1–3 times daily.",                             sideEffects:["Headache","Constipation"],                                                precautions:["Inform doctor of heart conditions"],                                                        requiresPrescription:true  },
  softovac:       { name:"Softovac",         category:"Laxative / Stool Softener",        purpose:"Relief of constipation — softens stool and promotes bowel movement.",                       dosage:"1–2 tsp in a glass of water at bedtime.",             sideEffects:["Bloating","Mild abdominal cramps"],                                       precautions:["Drink plenty of water","Not for long-term without doctor advice"],                          requiresPrescription:false },

  // ── Antihistamines ────────────────────────────────────────────────────────
  cetirizine:     { name:"Cetirizine",       category:"Antihistamine (2nd Gen)",          purpose:"Allergic rhinitis, hives, itching.",                                                        dosage:"10 mg once daily.",                                   sideEffects:["Mild drowsiness","Dry mouth","Headache"],                                 precautions:["Avoid driving if drowsy","Avoid alcohol"],                                                  requiresPrescription:false },
  loratadine:     { name:"Loratadine",       category:"Antihistamine (Non-Sedating)",     purpose:"Non-sedating antihistamine for allergic symptoms.",                                         dosage:"10 mg once daily.",                                   sideEffects:["Headache","Dry mouth"],                                                   precautions:["Avoid alcohol"],                                                                            requiresPrescription:false },

  // ── Antidiabetics ─────────────────────────────────────────────────────────
  metformin:      { name:"Metformin",        category:"Antidiabetic (Biguanide)",         purpose:"Controls blood sugar in Type 2 diabetes.",                                                  dosage:"500 mg twice daily with meals; increase gradually.",  sideEffects:["Nausea and diarrhoea (early)","Metallic taste"],                          precautions:["Take with food","Stop before surgery or contrast imaging"],                                 requiresPrescription:true  },

  // ── Cardiovascular ────────────────────────────────────────────────────────
  amlodipine:     { name:"Amlodipine",       category:"Calcium Channel Blocker",          purpose:"High blood pressure and angina.",                                                           dosage:"5–10 mg once daily.",                                 sideEffects:["Ankle swelling","Flushing","Dizziness"],                                  precautions:["Do not stop without advice","Monitor BP"],                                                  requiresPrescription:true  },
  atenolol:       { name:"Atenolol",         category:"Beta-Blocker",                     purpose:"High blood pressure and heart rate control.",                                               dosage:"25–100 mg once daily.",                               sideEffects:["Fatigue","Cold extremities","Slow heart rate"],                           precautions:["NEVER stop suddenly — taper with doctor","Caution in asthma"],                              requiresPrescription:true  },
  atorvastatin:   { name:"Atorvastatin",     category:"Statin (Lipid-Lowering)",          purpose:"Lowers LDL cholesterol and cardiovascular risk.",                                           dosage:"10–80 mg once daily.",                                sideEffects:["Muscle pain","Elevated liver enzymes"],                                   precautions:["Report unexplained muscle pain","Avoid grapefruit","Not in pregnancy"],                     requiresPrescription:true  },

  // ── Corticosteroids ───────────────────────────────────────────────────────
  prednisolone:   { name:"Prednisolone",     category:"Corticosteroid",                   purpose:"Anti-inflammatory and immunosuppressive for many conditions.",                              dosage:"5–60 mg/day as prescribed with food.",                sideEffects:["Weight gain","Raised blood sugar","Increased infection risk","Bone thinning"], precautions:["NEVER stop abruptly — taper slowly","Monitor BP and blood sugar"],                      requiresPrescription:true  },

  // ── Thyroid ───────────────────────────────────────────────────────────────
  levothyroxine:  { name:"Levothyroxine",    category:"Thyroid Hormone Replacement",      purpose:"Hypothyroidism — replaces thyroid hormone.",                                               dosage:"25–50 mcg/day initially; adjusted by TSH levels.",    sideEffects:["Over-replacement: palpitations, tremor, weight loss"],                    precautions:["Take on empty stomach 30–60 min before breakfast","Never adjust dose without doctor"],      requiresPrescription:true  },

  // ── Antidepressants ───────────────────────────────────────────────────────
  sertraline:     { name:"Sertraline",       category:"Antidepressant (SSRI)",            purpose:"Depression, anxiety, OCD, PTSD, panic disorder.",                                          dosage:"25–50 mg/day initially; up to 200 mg/day.",           sideEffects:["Nausea","Insomnia","Sexual dysfunction"],                                 precautions:["Do NOT stop abruptly","Allow 4–6 weeks for effect","Never combine with MAOIs"],             requiresPrescription:true  },

  // ── Anticoagulants ────────────────────────────────────────────────────────
  warfarin:       { name:"Warfarin",         category:"Anticoagulant",                    purpose:"Blood thinner — prevents clots, DVT, PE, and stroke.",                                     dosage:"Individualised — adjusted to INR target (2.0–3.0).",  sideEffects:["Bleeding"],                                                               precautions:["Regular INR monitoring mandatory","Avoid NSAIDs","Consistent vitamin K intake"],             requiresPrescription:true  },

  // ── Respiratory ───────────────────────────────────────────────────────────
  salbutamol:     { name:"Salbutamol",       category:"Bronchodilator (SABA)",            purpose:"Relief inhaler for asthma and COPD.",                                                       dosage:"1–2 puffs (100–200 mcg) as needed.",                  sideEffects:["Tremor","Palpitations","Headache"],                                       precautions:["Reliever only — not preventive","Frequent use signals poor control"],                       requiresPrescription:true  },
};

// ── Brand name / alias lookup → MEDICINE_DB key ──────────────────────────────
const ALIAS_MAP = {
  // paracetamol
  acetaminophen:"paracetamol", calpol:"paracetamol", crocin:"paracetamol",
  dolo:"paracetamol", panadol:"paracetamol", tylenol:"paracetamol", pcm:"paracetamol",
  // ibuprofen
  brufen:"ibuprofen", advil:"ibuprofen", nurofen:"ibuprofen", combiflam:"ibuprofen",
  // amoxicillin
  amoxil:"amoxicillin", novamox:"amoxicillin", amoxycillin:"amoxicillin",
  // azithromycin
  zithromax:"azithromycin", azithral:"azithromycin", azee:"azithromycin",
  // metformin
  glucophage:"metformin", glycomet:"metformin", obimet:"metformin",
  // omeprazole
  prilosec:"omeprazole", losec:"omeprazole", omez:"omeprazole",
  // pantoprazole
  protonix:"pantoprazole", pantocid:"pantoprazole", pan40:"pantoprazole",
  // cetirizine
  zyrtec:"cetirizine", cetzine:"cetirizine", alerid:"cetirizine",
  // loratadine
  claritin:"loratadine", clarityn:"loratadine",
  // aspirin
  disprin:"aspirin", ecosprin:"aspirin",
  // metronidazole
  flagyl:"metronidazole", metrogyl:"metronidazole",
  // diclofenac
  voltaren:"diclofenac", voveran:"diclofenac",
  // prednisolone
  omnacortil:"prednisolone", wysolone:"prednisolone",
  // atorvastatin
  lipitor:"atorvastatin", atorva:"atorvastatin",
  // amlodipine
  norvasc:"amlodipine", amlopin:"amlodipine", amlong:"amlodipine",
  // salbutamol
  ventolin:"salbutamol", asthalin:"salbutamol", albuterol:"salbutamol",
  // sertraline
  zoloft:"sertraline", lustral:"sertraline",
  // warfarin
  coumadin:"warfarin",
  // levothyroxine
  synthroid:"levothyroxine", thyronorm:"levothyroxine", eltroxin:"levothyroxine",
  // ciprofloxacin
  cipro:"ciprofloxacin", cifran:"ciprofloxacin", ciplox:"ciprofloxacin",
  // clindamycin
  dalacin:"clindamycin", cleocin:"clindamycin",
  // cephalexin
  keflex:"cephalexin",
  // doxycycline
  vibramycin:"doxycycline", doxy:"doxycycline",
  // ondansetron
  zofran:"ondansetron", emeset:"ondansetron",
  // tranexamic acid
  tranexamicacid:"tranexamic", tranexam:"tranexamic", traxyl:"tranexamic",
  tranic:"tranexamic", traqnic:"tranexamic", tranarest:"tranexamic",
  kapron:"tranexamic", texakind:"tranexamic", cyclokapron:"tranexamic",
  // iron supplements
  "ferrous sulfate":"ferroussulfate", "iron folic":"ironfolate",
  ferinject:"ferriccarboxymaltose",
  // vitamins
  "folic acid":"folicacid", folate:"folicacid",
  // softovac
  ispaghula:"softovac", cremaffin:"softovac",
  // vitamin D
  cholecalciferol:"vitamind",
};
// Add canonical keys as self-references
Object.keys(MEDICINE_DB).forEach(k => { ALIAS_MAP[k] = k; });


// ══════════════════════════════════════════════════════════════════════════════
// MEDICINE MATCHING UTILITIES
// ══════════════════════════════════════════════════════════════════════════════

function matchMedicineName(nameStr) {
  if (!nameStr) return null;
  const norm = nameStr.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  const raw  = nameStr.toLowerCase().trim();

  if (ALIAS_MAP[raw])  return ALIAS_MAP[raw];
  if (ALIAS_MAP[norm]) return ALIAS_MAP[norm];

  // Fuzzy prefix match (handles OCR/handwriting variants)
  for (const [alias, key] of Object.entries(ALIAS_MAP)) {
    const len = Math.min(6, Math.min(norm.length, alias.length) - 1);
    if (len >= 4 && norm.slice(0, len) === alias.slice(0, len)) return key;
  }
  for (const key of Object.keys(MEDICINE_DB)) {
    const len = Math.min(6, Math.min(norm.length, key.length) - 1);
    if (len >= 4 && norm.slice(0, len) === key.slice(0, len)) return key;
  }
  return null;
}

/**
 * Build enriched medicine cards from Vision API result.
 * Merges Vision-extracted data with MEDICINE_DB knowledge.
 * Unknown medicines (not in DB) still get a card from Vision data.
 */
function buildMedicinesFromVision(visionResult) {
  if (!visionResult?.medicines?.length) return [];
  const results = [], seen = new Set();

  for (const m of visionResult.medicines) {
    const nameToTry = m.normalizedName || m.name;
    const dbKey     = matchMedicineName(nameToTry);

    if (dbKey && MEDICINE_DB[dbKey] && !seen.has(dbKey)) {
      seen.add(dbKey);
      const db = MEDICINE_DB[dbKey];
      results.push({
        ...db,
        matchedAs:       m.name,
        visionDosage:    m.dosage    || "",
        visionFrequency: m.frequency || "",
        visionDuration:  m.duration  || "",
        confidence:      m.confidence,
        source:          "vision",
      });

    } else if (!dbKey && nameToTry?.trim().length >= 2) {
      // Vision found it but it's not in our DB — still show a card
      const display = nameToTry.charAt(0).toUpperCase() + nameToTry.slice(1);
      const dedupeKey = display.toLowerCase();
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        results.push({
          name:       display,
          category:   "Medicine (AI Detected)",
          purpose:    `Identified in your prescription. Consult your pharmacist for full details about ${display}.`,
          dosage:     [m.dosage, m.frequency, m.duration ? `for ${m.duration}` : ""]
                        .filter(Boolean).join(" ") || "As prescribed by your doctor.",
          sideEffects: ["Consult your pharmacist for side effect information."],
          precautions: ["Always follow your doctor's prescription exactly."],
          requiresPrescription: true,
          matchedAs:   m.name,
          confidence:  m.confidence,
          source:      "vision-unmatched",
        });
      }
    }
  }

  console.log("[controller] Medicines built:", results.map(m => `${m.name} [${m.source}]`));
  return results;
}

/**
 * Match medicines from raw OCR/text input (PATH B fallback).
 */
function analyzeTextLocally(rawText) {
  const lower = rawText.toLowerCase();
  const found = new Set(), results = [];

  const sortedAliases = Object.keys(ALIAS_MAP).sort((a, b) => b.length - a.length);
  for (const term of sortedAliases) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\w*`, "i");
    if (re.test(lower)) {
      const key = ALIAS_MAP[term];
      if (!found.has(key) && MEDICINE_DB[key]) {
        found.add(key);
        results.push({ ...MEDICINE_DB[key], matchedAs: term, source: "local-text" });
      }
    }
  }
  return results;
}

/**
 * Build highlighted segments array for frontend text highlighting.
 */
function buildHighlightedSegments(text, medicines) {
  if (!medicines?.length) return [{ text, highlighted: false, medicine: null }];

  const lower     = text.toLowerCase();
  const positions = [];

  for (const med of medicines) {
    const term    = (med.matchedAs || med.name).toLowerCase();
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re      = new RegExp(`\\b${escaped}\\w*`, "i");
    const match   = re.exec(lower);
    if (match) {
      positions.push({ start: match.index, end: match.index + match[0].length, name: med.name });
    }
  }

  positions.sort((a, b) => a.start - b.start);
  const segments = [];
  let cursor = 0;

  for (const { start, end, name } of positions) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start), highlighted: false, medicine: null });
    segments.push({ text: text.slice(start, end), highlighted: true, medicine: name });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), highlighted: false, medicine: null });

  return segments;
}


// ══════════════════════════════════════════════════════════════════════════════
// POST /api/prescription/analyze
// ══════════════════════════════════════════════════════════════════════════════
const analyzePrescription = async (req, res) => {
  try {
    let ocrText   = "";
    let confidence = 100;
    let medicines = [];
    let segments  = [];
    let warning   = null;
    let source    = "local";

    // ── PATH A: Image upload → OpenAI Vision ─────────────────────────────────
    if (req.file) {
      const { size, mimetype, originalname, buffer } = req.file;

      if (size > 10 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: "File too large. Maximum 10 MB." });
      }
      if (!ALLOWED_TYPES.has(mimetype)) {
        return res.status(400).json({ success: false, message: `Unsupported file type: ${mimetype}.` });
      }

      console.log(`\n[prescription] ── Upload: ${originalname} (${(size / 1024 / 1024).toFixed(2)} MB) ──`);

      // PDF — Vision cannot analyse PDFs directly
      if (mimetype === "application/pdf") {
        ocrText = `[PDF received: ${originalname}]`;
        warning = "PDF files cannot be analysed by AI Vision. Please photograph the prescription and upload the image.";
        source  = "pdf";

      } else {
        // ── Send image to OpenAI Vision ──────────────────────────────────────
        const visionResult = await analyzeWithVision(buffer, mimetype);

        if (visionResult === null) {
          // Vision service unavailable (no API key or error)
          const keySet = process.env.BEDROCK_API_KEY && process.env.BEDROCK_API_KEY.trim() !== "";

          if (!keySet) {
            ocrText = "[Vision API not configured]";
            warning = "⚙️ Add your Gemini API key to backend/.env as GEMINI_API_KEY=... then restart: npm run dev  —  Get a free key at https://aistudio.google.com/app/apikey";
            source  = "no-api-key";
          } else {
            ocrText = "[Vision API error — check server logs]";
            warning = "AI Vision encountered an error. Please try again or check server logs.";
            source  = "vision-error";
          }
          medicines = [];

        } else if (visionResult.medicines?.length > 0) {
          // ✅ Success — medicines extracted
          medicines  = buildMedicinesFromVision(visionResult);
          confidence = 92;
          ocrText    = `[AI Vision — ${visionResult.prescriptionType || "handwritten"} prescription analysed]`;
          source     = "vision";
          if (visionResult.notes) warning = `ℹ️ ${visionResult.notes}`;
          console.log(`[prescription] ✅ Vision detected ${medicines.length} medicine(s)`);

        } else {
          // Vision ran but found no medicines
          ocrText  = visionResult.notes || "AI Vision could not extract medicines from this image.";
          warning  = "Unable to detect medicines. Please upload a clearer prescription.";
          source   = "vision-empty";
          medicines = [];
        }
      }

      segments = buildHighlightedSegments(ocrText, medicines);
    }

    // ── PATH B: Raw OCR text (fallback / Tesseract) ───────────────────────────
    else if (req.body?.ocrText) {
      ocrText = String(req.body.ocrText).trim();
      if (ocrText.length < 3) {
        return res.status(400).json({ success: false, message: "ocrText is too short." });
      }
      console.log(`\n[prescription] ── Text mode: ${ocrText.length} chars ──`);
      medicines = analyzeTextLocally(ocrText);
      segments  = buildHighlightedSegments(ocrText, medicines);
      source    = "local-text";
      console.log(`[prescription] ✅ Local text matched ${medicines.length} medicine(s)`);

    } else {
      return res.status(400).json({ success: false, message: "Upload an image file or provide ocrText." });
    }

    console.log(`[prescription] source=${source} | medicines=${medicines.length}\n`);

    // ── Compose response ──────────────────────────────────────────────────────
    const responseData = {
      ocrText,
      confidence,
      highlightedSegments: segments,
      medicines,
      medicineCount: medicines.length,
      source,
    };
    if (warning) responseData.warning = warning;

    return res.status(200).json({ success: true, data: responseData });

  } catch (err) {
    console.error("[prescription] ❌ Unhandled error:", err);
    return res.status(500).json({ success: false, message: "Server error during analysis. Please try again." });
  }
};


// ══════════════════════════════════════════════════════════════════════════════
// GET /api/prescription/medicine/:name
// ══════════════════════════════════════════════════════════════════════════════
const getMedicineInfo = async (req, res) => {
  try {
    const query = (req.params.name || "").toLowerCase().trim();
    if (!query) return res.status(400).json({ success: false, message: "Medicine name required." });

    const key   = matchMedicineName(query);
    const entry = key ? MEDICINE_DB[key] : null;

    if (!entry) {
      return res.status(404).json({ success: false, message: `"${req.params.name}" not found in database.` });
    }
    return res.status(200).json({ success: true, data: entry });

  } catch (err) {
    console.error("[prescription] getMedicineInfo error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { analyzePrescription, getMedicineInfo };
