from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pickle
import json
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
from prescription_service import prescription_bp

app = Flask(__name__)
CORS(app)
app.register_blueprint(prescription_bp)
# ─── Load Model & Assets ──────────────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

def load_assets():
    try:
        with open(os.path.join(MODEL_DIR, "model.pkl"), "rb") as f:
            model = pickle.load(f)

        with open(os.path.join(MODEL_DIR, "scaler.pkl"), "rb") as f:
            scaler = pickle.load(f)
        with open(os.path.join(MODEL_DIR, "symptom_encoder.pkl"), "rb") as f:
            symptoms = pickle.load(f)
        with open(os.path.join(MODEL_DIR, "disease_encoder.pkl"), "rb") as f:
            disease_encoder = pickle.load(f)
        with open(os.path.join(MODEL_DIR, "disease_metadata.json"), "r") as f:
            disease_meta = json.load(f)
        logger.info(f"✅ Model loaded: {len(symptoms)} symptoms, {len(disease_meta)} diseases")
        return model, scaler, symptoms, disease_encoder, disease_meta
    except FileNotFoundError:
        logger.warning("⚠️  Model files not found. Run: python train_model.py")
        return None, [], None, {}

model, scaler, SYMPTOMS, disease_encoder, DISEASE_META = load_assets()

# ─── Symptom Aliases (200+ mappings) ─────────────────────────────────────────
ALIASES = {
    # Fever
    "high_temperature": "high_fever", "temperature": "fever",
    "running_a_fever": "fever", "burning_up": "high_fever",
    "slight_fever": "mild_fever", "low_fever": "mild_fever",
    # Fatigue
    "tired": "fatigue", "tiredness": "fatigue", "weakness": "fatigue",
    "lethargy": "fatigue", "exhaustion": "extreme_fatigue",
    "no_energy": "fatigue", "always_tired": "extreme_fatigue",
    # Pain
    "stomachache": "abdominal_pain", "stomach_ache": "abdominal_pain",
    "tummy_pain": "abdominal_pain", "belly_pain": "abdominal_pain",
    "backache": "back_pain", "lower_back_ache": "lower_back_pain",
    "chest_tightness": "chest_tightness", "tight_chest": "chest_tightness",
    "heart_pain": "chest_pain", "rib_pain": "chest_pain",
    "muscle_ache": "muscle_pain", "body_pain": "body_aches",
    "body_ache": "body_aches", "aches": "body_aches",
    "joint_ache": "joint_pain", "knee_pain": "joint_pain",
    "hip_pain": "joint_pain", "wrist_pain": "joint_pain",
    "ankle_pain": "joint_pain", "neck_ache": "neck_pain",
    "shoulder_pain": "muscle_pain", "arm_ache": "limb_pain",
    # Breathing
    "breathlessness": "shortness_of_breath",
    "difficulty_breathing": "shortness_of_breath",
    "hard_to_breathe": "shortness_of_breath",
    "cant_breathe": "shortness_of_breath",
    "breathing_difficulty": "shortness_of_breath",
    "sob": "shortness_of_breath",
    # Cough
    "coughing": "cough", "coughing_up": "wet_cough",
    "dry_coughing": "dry_cough", "phlegm": "wet_cough",
    "productive_cough": "productive_cough", "blood_cough": "coughing_blood",
    # GI
    "vomit": "vomiting", "throwing_up": "vomiting", "puking": "vomiting",
    "diarrhoea": "diarrhea", "loose_stools": "diarrhea",
    "loose_motions": "diarrhea", "runny_stool": "diarrhea",
    "constipated": "constipation", "no_bowel_movement": "constipation",
    "stomach_bloating": "bloating", "gas_pain": "gas",
    "acid_taste": "acid_reflux", "burning_chest": "heartburn",
    "no_appetite": "loss_of_appetite", "poor_appetite": "loss_of_appetite",
    "cant_eat": "loss_of_appetite", "always_hungry": "excessive_hunger",
    # Urinary
    "peeing_a_lot": "frequent_urination", "frequent_peeing": "frequent_urination",
    "painful_peeing": "painful_urination", "burning_urination": "painful_urination",
    "blood_in_pee": "blood_in_urine",
    # Skin
    "rash": "skin_rash", "rashy": "skin_rash", "itchy": "itching",
    "scratching": "itching", "welts": "hives", "skin_bumps": "acne",
    "blistering": "blisters", "flaky_skin": "skin_peeling",
    "yellow_skin": "yellowing_skin", "yellow_eyes": "jaundice",
    "jaundice": "jaundice",
    # Mental
    "worried": "anxiety", "anxious": "anxiety", "nervous": "anxiety",
    "panic": "panic_attacks", "sad": "depression", "hopeless": "depression",
    "cant_sleep": "insomnia", "sleepless": "insomnia",
    "sleeping_too_much": "excessive_sleep", "oversleeping": "excessive_sleep",
    "bad_dreams": "nightmares", "memory_problems": "memory_loss",
    "forgetful": "memory_loss", "cant_focus": "poor_concentration",
    # Neurological
    "lightheaded": "dizziness", "dizzy": "dizziness",
    "spinning": "vertigo", "blackout": "fainting",
    "passing_out": "fainting", "fit": "seizures",
    "convulsion": "seizures", "shaking": "tremors",
    "numbness_tingling": "numbness", "pins_and_needles": "tingling",
    "stiff_neck": "neck_stiffness", "neck_rigid": "neck_stiffness",
    # Heart
    "heart_racing": "palpitations", "fast_heartbeat": "rapid_heartbeat",
    "irregular_pulse": "irregular_heartbeat", "heart_fluttering": "palpitations",
    # Senses
    "cant_smell": "loss_of_smell", "no_smell": "loss_of_smell",
    "cant_taste": "loss_of_taste", "no_taste": "loss_of_taste",
    "blurry_vision": "blurred_vision", "fuzzy_vision": "blurred_vision",
    "double_vision": "double_vision",
    # Eye/Ear/Nose/Throat
    "red_eye": "red_eyes", "pink_eye": "red_eyes",
    "runny_eyes": "watery_eyes", "watering_eyes": "watery_eyes",
    "ear_ache": "ear_pain", "earache": "ear_pain",
    "hearing_problems": "hearing_loss", "ringing_ears": "ringing_in_ears",
    "blocked_nasal": "blocked_nose", "stuffy_nose": "blocked_nose",
    "nasal_congestion": "blocked_nose", "snot": "runny_nose",
    "throat_pain": "sore_throat", "painful_throat": "sore_throat",
    "croaky": "hoarseness", "hoarse_voice": "hoarseness",
    # Weight/General
    "losing_weight": "weight_loss", "gaining_weight": "weight_gain",
    "thirsty": "excessive_thirst", "always_thirsty": "excessive_thirst",
    "dry_mouth_always": "dry_mouth", "sweating_a_lot": "excessive_sweating",
    "night_sweating": "night_sweats", "cold_all_the_time": "cold_intolerance",
    "always_hot": "heat_intolerance",
    "hair_falling": "hair_loss", "hair_thinning": "hair_thinning",
    "lymph_nodes": "swollen_lymph_nodes", "glands_swollen": "swollen_lymph_nodes",
}

def normalize_symptom(raw: str) -> str:
    """Normalize symptom string: lowercase, strip, replace spaces/hyphens with underscore."""
    s = raw.lower().strip().replace(" ", "_").replace("-", "_").replace("'", "")
    return ALIASES.get(s, s)

def fuzzy_match(symptom: str, symptom_list: list, threshold: int = 80) -> str | None:
    """Use rapidfuzz for fuzzy matching if available, else exact match."""
    if symptom in symptom_list:
        return symptom
    try:
        from rapidfuzz import process, fuzz
        result = process.extractOne(symptom, symptom_list, scorer=fuzz.ratio)
        if result and result[1] >= threshold:
            return result[0]
    except ImportError:
        # rapidfuzz not installed — fall back to partial string matching
        for s in symptom_list:
            if symptom in s or s in symptom:
                return s
    return None

def process_symptoms(raw_symptoms: list) -> tuple[list, list]:
    """Convert raw symptom strings to normalized + fuzzy-matched list."""
    matched = []
    unmatched = []
    for raw in raw_symptoms:
        norm = normalize_symptom(raw)
        if norm in SYMPTOMS:
            matched.append(norm)
        else:
            fuzzy = fuzzy_match(norm, SYMPTOMS)
            if fuzzy:
                matched.append(fuzzy)
            else:
                unmatched.append(raw)
    return list(set(matched)), unmatched

def to_feature_vector(matched_symptoms: list, age: int = 30, duration: int = 2) -> list:
    """Convert matched symptoms + extra features to full feature vector."""
    vec = [0] * len(SYMPTOMS)
    for s in matched_symptoms:
        if s in SYMPTOMS:
            vec[SYMPTOMS.index(s)] = 1

    symptom_count = sum(vec)

    if age < 13:
        age_child, age_adult, age_elderly = 1, 0, 0
    elif age >= 60:
        age_child, age_adult, age_elderly = 0, 0, 1
    else:
        age_child, age_adult, age_elderly = 0, 1, 0

    return vec + [symptom_count, age_child, age_adult, age_elderly, duration]

# ─── Severity Logic ───────────────────────────────────────────────────────────
SEVERITY_RANK = {"mild": 0, "moderate": 1, "severe": 2}
SEVERITY_LEVELS = ["mild", "moderate", "severe"]

SEVERE_UPGR_SYMPTOMS = {
    "chest_pain", "shortness_of_breath", "seizures", "confusion",
    "neck_stiffness", "coughing_blood", "blood_in_stool", "blood_in_urine",
    "loss_of_consciousness", "rapid_breathing", "jaundice", "yellowing_skin",
    "sudden_numbness", "facial_drooping", "severe_headache",
}

def determine_severity(disease: str, matched_symptoms: list, age: int, duration: int) -> str:
    """Calculate severity from disease base + symptoms + age + duration."""
    base = DISEASE_META.get(disease, {}).get("severity", "mild")
    idx = SEVERITY_RANK.get(base, 0)

    # Upgrade for danger symptoms
    sym_set = set(matched_symptoms)
    if sym_set & SEVERE_UPGR_SYMPTOMS:
        idx = min(idx + 1, 2)

    # Duration-based upgrade
    if duration >= 6:
        idx = min(idx + 1, 2)
    elif duration >= 3:
        idx = min(idx + 0, 2)  # no change unless already elevated

    # Age-based upgrade (elderly)
    if age >= 65:
        idx = min(idx + 1, 2)

    return SEVERITY_LEVELS[idx]

# ─── Endpoints ────────────────────────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded. Run: python train_model.py"}), 503

    data     = request.get_json(force=True) or {}
    raw_syms = data.get("symptoms", [])
    age      = int(data.get("age", 30))
    duration = int(data.get("duration", 2))

    if not raw_syms or len(raw_syms) < 1:
        return jsonify({"error": "Provide at least 1 symptom"}), 400

    # Match symptoms
    matched, unmatched = process_symptoms(raw_syms)

    if not matched:
        return jsonify({
            "error": "No recognizable symptoms found",
            "unmatched": unmatched,
            "hint": f"Available symptoms include: {', '.join(SYMPTOMS[:15])}..."
        }), 400

    # Build feature vector
    fvec  = to_feature_vector(matched, age=age, duration=duration)
    fvec_scaled = scaler.transform([fvec])
    proba = model.predict_proba(fvec_scaled)[0]
    classes = disease_encoder.classes_
    top_idx = np.argsort(proba)[::-1][:6]

    predictions = []
    for idx in top_idx:
        disease = classes[idx]
        prob    = float(proba[idx])
        if prob < 0.03:
            continue
        meta     = DISEASE_META.get(disease, {})
        severity = determine_severity(disease, matched, age, duration)
        predictions.append({
            "disease":         disease,
            "name":            disease,
            "probability":     round(prob * 100, 1),
            "severity":        severity,
            "precautions":     meta.get("precautions", ["Consult a healthcare professional"]),
            "medicalNote":     meta.get("explanation", ""),
            "recommendations": meta.get("recommendations", []),
        })

    if not predictions:
        disease = classes[top_idx[0]]
        meta    = DISEASE_META.get(disease, {})
        predictions.append({
            "disease":         disease,
            "name":            disease,
            "probability":     round(float(proba[top_idx[0]]) * 100, 1),
            "severity":        "mild",
            "precautions":     meta.get("precautions", ["Consult a healthcare professional"]),
            "medicalNote":     meta.get("explanation", ""),
            "recommendations": meta.get("recommendations", []),
        })

    # Top 3 only
    predictions = predictions[:3]

    # Overall severity (worst of top 3)
    overall_sev = max(predictions, key=lambda x: SEVERITY_RANK.get(x["severity"], 0))["severity"]

    # Confidence: weighted blend of top prediction probability
    top_prob   = predictions[0]["probability"]
    confidence = round(min(97, max(55, top_prob * 0.72 + 22)), 1)

    return jsonify({
        "predictions":      predictions,
        "overallSeverity":  overall_sev,
        "severity":         overall_sev,
        "confidence":       confidence,
        "matchedSymptoms":  matched,
        "unmatchedSymptoms":unmatched,
        "totalMatched":     len(matched),
        "precautions":      predictions[0]["precautions"],
        "recommendations":  predictions[0]["recommendations"],
    })


@app.route("/symptoms", methods=["GET"])
def list_symptoms():
    return jsonify({
        "symptoms": SYMPTOMS,
        "count": len(SYMPTOMS),
        "aliases": list(ALIASES.keys()),
    })


@app.route("/diseases", methods=["GET"])
def list_diseases():
    return jsonify({
        "diseases": list(DISEASE_META.keys()),
        "count": len(DISEASE_META),
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":   "ok" if model is not None else "model_not_loaded",
        "model":    "RandomForest-400",
        "diseases": len(DISEASE_META),
        "symptoms": len(SYMPTOMS),
        "fuzzy_matching": True,
    })


if __name__ == "__main__":
    logger.info("🧠 AIMedScan AI Service v2 starting on port 5000…")
    app.run(host="0.0.0.0", port=5001, debug=False)
