import os
import re
import json
import logging
from pathlib import Path

from flask import Blueprint, request, jsonify

# ── Conditional imports with graceful fallback ────────────────────────────────
try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logging.warning("[prescription] opencv-python not installed — preprocessing disabled")

try:
    import pytesseract
    from PIL import Image, ImageEnhance, ImageFilter
    import io as _io
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logging.warning("[prescription] pytesseract/Pillow not installed — OCR disabled")

try:
    from pdf2image import convert_from_bytes
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    logging.warning("[prescription] pdf2image not installed — PDF support disabled")

# ── Blueprint ─────────────────────────────────────────────────────────────────
prescription_bp = Blueprint("prescription", __name__)
logger = logging.getLogger(__name__)

# ── Load medicine database ────────────────────────────────────────────────────
_MODELS_DIR = Path(__file__).parent / "models"
_DB_PATH    = _MODELS_DIR / "medicine_database.json"


def _load_db() -> dict:
    try:
        with open(_DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error(f"medicine_database.json not found at {_DB_PATH}")
        return {}
    except json.JSONDecodeError as exc:
        logger.error(f"Invalid JSON in medicine_database.json: {exc}")
        return {}


MEDICINE_DB: dict = _load_db()

# ── Build alias → canonical key reverse lookup ────────────────────────────────
ALIAS_MAP: dict[str, str] = {}   # alias_lower → canonical_key

for _key, _entry in MEDICINE_DB.items():
    ALIAS_MAP[_key.lower()] = _key
    for _alias in _entry.get("aliases", []):
        ALIAS_MAP[_alias.lower().strip()] = _key


# ════════════════════════════════════════════════════════════════════════════
# IMAGE PREPROCESSING
# ════════════════════════════════════════════════════════════════════════════

def _preprocess_image(image_bytes: bytes):
    """
    Preprocess prescription image to maximise OCR accuracy:
      1. Decode to numpy / PIL
      2. Grayscale conversion
      3. Resize small images to ≥2000px on the longest side (optimal for Tesseract)
      4. Adaptive thresholding (handles uneven lighting & handwriting)
      5. Morphological noise removal
    Returns a PIL Image ready for pytesseract.
    """
    if CV2_AVAILABLE:
        arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode image — unsupported format or corrupt file")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Upscale small images
        h, w = gray.shape
        scale = max(1.0, 2200.0 / max(h, w))
        if scale > 1.1:
            gray = cv2.resize(gray, (int(w * scale), int(h * scale)),
                              interpolation=cv2.INTER_CUBIC)

        # Adaptive threshold — handles shadows and uneven ink
        thresh = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            blockSize=31, C=10
        )

        # Remove speckle noise
        kernel = np.ones((1, 1), np.uint8)
        clean  = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

        # Return as PIL
        return Image.fromarray(clean)

    # Fallback: PIL-only basic enhancement
    img = Image.open(_io.BytesIO(image_bytes)).convert("L")
    img = ImageEnhance.Contrast(img).enhance(2.5)
    img = ImageEnhance.Sharpness(img).enhance(2.0)
    return img


# ════════════════════════════════════════════════════════════════════════════
# OCR ENGINE
# ════════════════════════════════════════════════════════════════════════════

_TESSERACT_CONFIG = r"--oem 3 --psm 4"


def run_ocr_on_image(image_bytes: bytes) -> tuple[str, float]:
    """
    Run Tesseract OCR on raw image bytes.
    Returns (text, confidence_0_to_100).
    """
    if not TESSERACT_AVAILABLE:
        raise RuntimeError("pytesseract is not installed. Run: pip install pytesseract Pillow")

    pil_img = _preprocess_image(image_bytes)

    # Get per-word confidence data
    data = pytesseract.image_to_data(pil_img, lang="eng",
                                     config=_TESSERACT_CONFIG,
                                     output_type=pytesseract.Output.DICT)
    confs = [int(c) for c, t in zip(data["conf"], data["text"])
             if t.strip() and int(c) > 0]
    avg_conf = sum(confs) / len(confs) if confs else 0.0

    full_text = pytesseract.image_to_string(pil_img, lang="eng", config=_TESSERACT_CONFIG)
    return full_text.strip(), round(avg_conf, 1)


def run_ocr_on_pdf(pdf_bytes: bytes, max_pages: int = 3) -> tuple[str, float]:
    """
    Extract text from a PDF prescription (first max_pages pages).
    Returns (combined_text, average_confidence).
    """
    if not PDF_AVAILABLE:
        raise RuntimeError("pdf2image not installed. Run: pip install pdf2image && sudo apt-get install poppler-utils")
    if not TESSERACT_AVAILABLE:
        raise RuntimeError("pytesseract not installed")

    pages = convert_from_bytes(pdf_bytes, dpi=300, first_page=1, last_page=max_pages)
    texts, confs = [], []
    for page in pages:
        buf = _io.BytesIO()
        page.save(buf, format="PNG")
        t, c = run_ocr_on_image(buf.getvalue())
        texts.append(t)
        confs.append(c)

    combined = "\n\n".join(texts)
    avg_c    = sum(confs) / len(confs) if confs else 0.0
    return combined, round(avg_c, 1)


# ════════════════════════════════════════════════════════════════════════════
# TEXT NORMALISATION
# ════════════════════════════════════════════════════════════════════════════

# Common OCR misreads for drug names (zero → o, one → l, etc.)
_OCR_FIXES = {
    r"\b0mepraz": "omepraz",
    r"\bibupr0fen": "ibuprofen",
    r"\bparacetamo1": "paracetamol",
    r"\bamoxici1lin": "amoxicillin",
    r"\bmetf0rmin": "metformin",
    r"\bcetirizin3": "cetirizine",
    r"\basp1rin": "aspirin",
}


def normalise_text(raw: str) -> str:
    """Clean OCR output: fix common misreads, collapse whitespace, strip noise."""
    text = raw
    for pattern, replacement in _OCR_FIXES.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    text = re.sub(r"[^\w\s.,\-()/%:\n]", " ", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# ════════════════════════════════════════════════════════════════════════════
# MEDICINE EXTRACTION
# ════════════════════════════════════════════════════════════════════════════

def extract_medicines(text: str) -> list[dict]:
    """
    Scan normalised text for known medicine names / aliases.
    Returns list of matched medicine info dicts with highlight positions.
    Deduplicates by canonical key and uses longest-match-first to reduce false positives.
    """
    lower = text.lower()
    found_keys: set[str] = set()
    results: list[dict]  = []

    # Sort aliases longest-first to catch full names before substrings
    sorted_aliases = sorted(ALIAS_MAP.keys(), key=len, reverse=True)

    for alias in sorted_aliases:
        pattern = r"\b" + re.escape(alias) + r"\w*"
        match   = re.search(pattern, lower)
        if match:
            key = ALIAS_MAP[alias]
            if key not in found_keys:
                found_keys.add(key)
                results.append({
                    "key":          key,
                    "matched_text": text[match.start():match.end()],
                    "position":     [match.start(), match.end()],
                })

    return results


def build_medicine_detail(match: dict) -> dict:
    """Build the full API response object for one medicine match."""
    key   = match["key"]
    entry = MEDICINE_DB.get(key, {})
    return {
        "name":                entry.get("name", key.title()),
        "matchedAs":           match["matched_text"],
        "purpose":             entry.get("purpose",   "Information not available."),
        "dosage":              entry.get("dosage",    "Consult your doctor or pharmacist."),
        "sideEffects":         entry.get("sideEffects",  []),
        "precautions":         entry.get("precautions",  []),
        "category":            entry.get("category",  "Unknown"),
        "requiresPrescription": entry.get("requiresPrescription", False),
        "highlightPosition":   match.get("position"),
    }


def build_highlighted_segments(text: str, matches: list[dict]) -> list[dict]:
    """
    Split OCR text into segments: normal text and highlighted medicine spans.
    Used by the frontend to colour-highlight detected names.
    """
    if not matches:
        return [{"text": text, "highlighted": False, "medicine": None}]

    positions = sorted(
        [(m["position"][0], m["position"][1], MEDICINE_DB.get(m["key"], {}).get("name", m["key"].title()))
         for m in matches],
        key=lambda x: x[0]
    )

    segments: list[dict] = []
    cursor = 0

    for start, end, name in positions:
        if start > cursor:
            segments.append({"text": text[cursor:start], "highlighted": False, "medicine": None})
        segments.append({"text": text[start:end], "highlighted": True, "medicine": name})
        cursor = end

    if cursor < len(text):
        segments.append({"text": text[cursor:], "highlighted": False, "medicine": None})

    return segments


# ════════════════════════════════════════════════════════════════════════════
# FLASK ROUTES
# ════════════════════════════════════════════════════════════════════════════

@prescription_bp.route("/analyze-prescription", methods=["POST"])
def analyze_prescription():
    """
    POST /analyze-prescription
    ──────────────────────────
    Accepts:
      - multipart/form-data  { file: <image|pdf> }   → server-side OCR
      - application/json     { ocrText: <string> }   → text already extracted

    Response JSON:
    {
      "success": true,
      "ocrText": "...",
      "confidence": 82.5,
      "highlightedSegments": [ {text, highlighted, medicine}, ... ],
      "medicines": [ {name, matchedAs, purpose, dosage, sideEffects, precautions,
                      category, requiresPrescription, highlightPosition}, ... ],
      "medicineCount": 3,
      "warning": "..."   // optional — low confidence, service degraded, etc.
    }
    """
    ocr_text   = ""
    confidence = 100.0
    warning    = None

    # ── Mode A: pre-extracted text ────────────────────────────────────────────
    if request.is_json:
        body     = request.get_json(silent=True) or {}
        ocr_text = body.get("ocrText", "").strip()
        if not ocr_text:
            return jsonify({"success": False, "error": "ocrText field is empty"}), 400

    # ── Mode B: file upload → server-side OCR ─────────────────────────────────
    elif "file" in request.files:
        uploaded = request.files["file"]
        filename = uploaded.filename or ""
        raw      = uploaded.read()

        if not raw:
            return jsonify({"success": False, "error": "Uploaded file is empty"}), 400

        ext = Path(filename).suffix.lower()
        logger.info(f"[prescription] File received: {filename} ({len(raw)/1024:.1f} KB)")

        try:
            if ext == ".pdf":
                ocr_text, confidence = run_ocr_on_pdf(raw)
            else:
                ocr_text, confidence = run_ocr_on_image(raw)
        except RuntimeError as exc:
            # OCR engine not installed
            return jsonify({"success": False, "error": str(exc)}), 501
        except Exception as exc:
            logger.exception("OCR error")
            return jsonify({"success": False, "error": f"OCR failed: {exc}"}), 500

        if confidence < 40:
            warning = (
                f"OCR confidence is low ({confidence:.0f}%). "
                "The image may be blurry, poorly lit, or handwritten. "
                "Please verify results with your pharmacist."
            )
    else:
        return jsonify({
            "success": False,
            "error": "Provide a file (multipart) or ocrText (JSON)"
        }), 400

    # ── Extract + match medicines ─────────────────────────────────────────────
    if not ocr_text.strip():
        return jsonify({
            "success": True, "ocrText": "", "confidence": confidence,
            "highlightedSegments": [], "medicines": [], "medicineCount": 0,
            "warning": "No text could be extracted. Try a higher-quality image."
        })

    clean_text = normalise_text(ocr_text)
    raw_matches = extract_medicines(clean_text)
    medicines   = [build_medicine_detail(m) for m in raw_matches]
    segments    = build_highlighted_segments(clean_text, raw_matches)

    logger.info(f"[prescription] OCR conf={confidence:.1f}% | medicines={len(medicines)}")

    resp = {
        "success":             True,
        "ocrText":             clean_text,
        "confidence":          confidence,
        "highlightedSegments": segments,
        "medicines":           medicines,
        "medicineCount":       len(medicines),
    }
    if warning:
        resp["warning"] = warning
    return jsonify(resp), 200


@prescription_bp.route("/medicine-lookup/<medicine_name>", methods=["GET"])
def medicine_lookup(medicine_name: str):
    """
    GET /medicine-lookup/<name>
    Direct lookup of a single medicine by name or alias.
    """
    query = medicine_name.strip().lower()
    key   = ALIAS_MAP.get(query)

    # Fuzzy partial match fallback
    if not key:
        for alias, k in ALIAS_MAP.items():
            if query in alias or alias in query:
                key = k
                break

    if not key or key not in MEDICINE_DB:
        return jsonify({"success": False, "error": f"Medicine '{medicine_name}' not found"}), 404

    entry = MEDICINE_DB[key]
    return jsonify({
        "success": True,
        "medicine": {
            "name":                entry.get("name", key.title()),
            "purpose":             entry.get("purpose"),
            "dosage":              entry.get("dosage"),
            "sideEffects":         entry.get("sideEffects", []),
            "precautions":         entry.get("precautions", []),
            "category":            entry.get("category"),
            "requiresPrescription": entry.get("requiresPrescription", False),
        }
    }), 200


@prescription_bp.route("/prescription-health", methods=["GET"])
def prescription_health():
    """GET /prescription-health — capability check for the prescription module."""
    return jsonify({
        "module":           "prescription_analyzer",
        "status":           "ok",
        "ocr_available":    TESSERACT_AVAILABLE,
        "cv2_available":    CV2_AVAILABLE,
        "pdf_available":    PDF_AVAILABLE,
        "medicines_loaded": len(MEDICINE_DB),
        "aliases_indexed":  len(ALIAS_MAP),
    }), 200
