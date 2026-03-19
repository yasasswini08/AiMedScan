import numpy as np
import json
import random

# ─── SYMPTOM MASTER LIST (200+) ───────────────────────────────────────────────
SYMPTOMS = [
    # Fever & Temperature
    "fever", "high_fever", "mild_fever", "low_grade_fever", "chills", "night_sweats", "sweating",
    # Head & Neurological
    "headache", "severe_headache", "migraine", "dizziness", "vertigo", "fainting", "confusion",
    "memory_loss", "numbness", "tingling", "tremors", "seizures", "neck_stiffness",
    # Eyes, Ears, Nose, Throat
    "blurred_vision", "double_vision", "eye_pain", "red_eyes", "watery_eyes",
    "ear_pain", "hearing_loss", "ringing_in_ears",
    "runny_nose", "blocked_nose", "sneezing", "nosebleed", "loss_of_smell",
    "sore_throat", "hoarseness", "difficulty_swallowing",
    # Respiratory
    "cough", "dry_cough", "wet_cough", "persistent_cough", "whooping_cough",
    "shortness_of_breath", "wheezing", "rapid_breathing", "chest_pain", "chest_tightness",
    "chest_congestion", "coughing_blood",
    # Cardiovascular
    "palpitations", "rapid_heartbeat", "irregular_heartbeat", "slow_heartbeat",
    "chest_pressure", "arm_pain", "jaw_pain",
    # Digestive
    "nausea", "vomiting", "diarrhea", "constipation", "abdominal_pain", "abdominal_cramps",
    "bloating", "gas", "heartburn", "acid_reflux", "indigestion", "loss_of_appetite",
    "increased_appetite", "difficulty_swallowing", "blood_in_stool", "black_stool",
    "stomach_cramps", "rectal_pain", "jaundice", "abdominal_swelling",
    # Urinary & Reproductive
    "frequent_urination", "painful_urination", "blood_in_urine", "cloudy_urine",
    "reduced_urination", "urinary_incontinence", "pelvic_pain", "vaginal_discharge",
    "irregular_periods", "heavy_periods", "testicular_pain",
    # Musculoskeletal
    "joint_pain", "joint_swelling", "joint_stiffness", "back_pain", "lower_back_pain",
    "upper_back_pain", "neck_pain", "muscle_pain", "muscle_weakness", "muscle_cramps",
    "body_aches", "bone_pain", "limb_pain", "swollen_joints", "morning_stiffness",
    # Skin
    "skin_rash", "itching", "hives", "blisters", "skin_peeling", "dry_skin",
    "oily_skin", "acne", "skin_lesions", "skin_discoloration", "bruising",
    "yellowing_skin", "pale_skin", "flushing", "hair_loss", "nail_changes",
    # General / Systemic
    "fatigue", "extreme_fatigue", "weakness", "malaise", "lethargy",
    "weight_loss", "weight_gain", "loss_of_taste", "excessive_thirst",
    "excessive_hunger", "dehydration", "swollen_lymph_nodes", "swelling",
    "swollen_face", "swollen_feet", "anemia_symptoms",
    # Mental / Psychological
    "anxiety", "panic_attacks", "depression", "mood_swings", "irritability",
    "insomnia", "excessive_sleep", "nightmares", "poor_concentration",
    "hallucinations", "paranoia", "social_withdrawal",
    # Endocrine / Metabolic
    "heat_intolerance", "cold_intolerance", "excessive_sweating", "dry_mouth",
    "hair_thinning", "brittle_nails", "puffy_face", "rapid_weight_gain",
    "slow_healing", "frequent_infections",
    # Specific
    "productive_cough", "blood_in_sputum", "foul_breath", "metallic_taste",
    "light_sensitivity", "sound_sensitivity", "smell_sensitivity",
    "skin_warmth", "skin_redness", "swollen_tonsils", "white_patches_throat",
]

# ─── DISEASE KNOWLEDGE BASE (100+ diseases) ──────────────────────────────────
DISEASE_DB = {

    # ── RESPIRATORY ──────────────────────────────────────────────────────────
    "Common Cold": {
        "primary":     ["runny_nose", "sneezing", "sore_throat", "cough", "mild_fever"],
        "secondary":   ["headache", "fatigue", "blocked_nose", "watery_eyes", "loss_of_appetite"],
        "rare":        ["ear_pain", "hoarseness"],
        "severity":    "mild",
        "precautions": ["Rest at home", "Stay hydrated with warm fluids", "Steam inhalation", "Gargle with warm salt water", "Take OTC cold medications"],
        "explanation": "A viral upper respiratory infection caused by rhinoviruses. Usually resolves in 7-10 days.",
        "recommendations": ["Vitamin C supplements", "Honey and ginger tea", "Avoid cold drinks"],
    },
    "Influenza": {
        "primary":     ["high_fever", "body_aches", "fatigue", "headache", "chills"],
        "secondary":   ["dry_cough", "sore_throat", "sweating", "loss_of_appetite"],
        "rare":        ["vomiting", "diarrhea", "ear_pain"],
        "severity":    "moderate",
        "precautions": ["Bed rest and isolate", "Take antiviral medication within 48 hrs", "Monitor temperature", "Drink electrolyte fluids"],
        "explanation": "A highly contagious respiratory illness caused by influenza A or B viruses.",
        "recommendations": ["Annual flu vaccine", "Antiviral drugs if within 48 hrs", "Electrolyte drinks"],
    },
    "COVID-19": {
        "primary":     ["fever", "dry_cough", "fatigue", "loss_of_taste", "loss_of_smell"],
        "secondary":   ["shortness_of_breath", "body_aches", "headache", "sore_throat", "chills"],
        "rare":        ["diarrhea", "skin_rash", "red_eyes", "chest_pain"],
        "severity":    "moderate",
        "precautions": ["Isolate immediately", "Monitor oxygen with pulse oximeter", "Seek emergency if SpO2 < 94%"],
        "explanation": "Caused by SARS-CoV-2 coronavirus. Ranges from mild to life-threatening.",
        "recommendations": ["COVID-19 vaccination", "Antiviral treatment if eligible", "Rest and hydration"],
    },
    "Asthma": {
        "primary":     ["wheezing", "shortness_of_breath", "chest_tightness", "dry_cough"],
        "secondary":   ["rapid_breathing", "fatigue", "anxiety", "cough"],
        "rare":        ["cyanosis", "chest_pain"],
        "severity":    "moderate",
        "precautions": ["Use prescribed inhaler immediately", "Avoid triggers (dust, smoke, pollen)", "Sit upright"],
        "explanation": "Chronic inflammatory disease of the airways causing recurrent breathing difficulty.",
        "recommendations": ["Carry rescue inhaler always", "Allergy testing", "Air purifier at home"],
    },
    "Bronchitis": {
        "primary":     ["persistent_cough", "chest_congestion", "fatigue", "mild_fever"],
        "secondary":   ["wet_cough", "shortness_of_breath", "chest_pain", "sore_throat"],
        "rare":        ["wheezing", "body_aches"],
        "severity":    "mild",
        "precautions": ["Avoid smoking", "Stay hydrated", "Use humidifier", "Rest adequately"],
        "explanation": "Inflammation of the bronchial tubes. Acute bronchitis is usually viral.",
        "recommendations": ["Expectorant cough syrup", "Avoid secondhand smoke", "Honey and lemon tea"],
    },
    "Pneumonia": {
        "primary":     ["high_fever", "productive_cough", "shortness_of_breath", "chest_pain", "chills"],
        "secondary":   ["fatigue", "sweating", "rapid_breathing", "loss_of_appetite", "nausea"],
        "rare":        ["confusion", "coughing_blood", "cyanosis"],
        "severity":    "severe",
        "precautions": ["Seek immediate medical attention", "Complete full antibiotic course", "Monitor oxygen levels"],
        "explanation": "Serious lung infection that inflames air sacs. Caused by bacteria, viruses, or fungi.",
        "recommendations": ["Hospitalization may be needed", "Pneumonia vaccine", "Complete antibiotic course"],
    },
    "Tuberculosis": {
        "primary":     ["persistent_cough", "blood_in_sputum", "night_sweats", "weight_loss", "fatigue"],
        "secondary":   ["low_grade_fever", "chest_pain", "loss_of_appetite", "chills"],
        "rare":        ["swollen_lymph_nodes", "back_pain"],
        "severity":    "severe",
        "precautions": ["Immediate medical evaluation", "Complete 6-9 month antibiotic course", "Isolate to prevent spread"],
        "explanation": "A bacterial infection caused by Mycobacterium tuberculosis primarily affecting the lungs.",
        "recommendations": ["DOTS therapy", "Regular sputum tests", "BCG vaccination"],
    },
    "Sinusitis": {
        "primary":     ["blocked_nose", "facial_pain", "headache", "runny_nose", "loss_of_smell"],
        "secondary":   ["mild_fever", "fatigue", "sore_throat", "cough", "foul_breath"],
        "rare":        ["ear_pain", "toothache"],
        "severity":    "mild",
        "precautions": ["Nasal saline rinses", "Steam inhalation", "Stay hydrated", "Decongestants"],
        "explanation": "Inflammation of the sinuses, often following a cold or allergy.",
        "recommendations": ["Neti pot for nasal irrigation", "Avoid allergens", "Humidifier"],
    },
    "Allergic Rhinitis": {
        "primary":     ["sneezing", "runny_nose", "itching", "watery_eyes", "blocked_nose"],
        "secondary":   ["headache", "fatigue", "sore_throat", "ear_pain", "cough"],
        "rare":        ["loss_of_smell", "hives"],
        "severity":    "mild",
        "precautions": ["Identify and avoid allergens", "Antihistamines", "Saline nasal rinse"],
        "explanation": "Allergic response to environmental allergens like pollen, dust mites, pet dander.",
        "recommendations": ["Allergy testing", "Immunotherapy shots", "Air purifier"],
    },
    "COPD": {
        "primary":     ["persistent_cough", "shortness_of_breath", "wheezing", "chest_tightness"],
        "secondary":   ["fatigue", "weight_loss", "frequent_infections", "cyanosis"],
        "rare":        ["leg_swelling", "depression"],
        "severity":    "severe",
        "precautions": ["Stop smoking immediately", "Pulmonary rehabilitation", "Use prescribed inhalers"],
        "explanation": "Chronic obstructive pulmonary disease — progressive lung disease mainly caused by smoking.",
        "recommendations": ["Smoking cessation program", "Flu and pneumonia vaccines", "Pulmonary rehab"],
    },
    "Whooping Cough": {
        "primary":     ["whooping_cough", "persistent_cough", "vomiting", "mild_fever"],
        "secondary":   ["runny_nose", "sneezing", "fatigue", "loss_of_appetite"],
        "rare":        ["seizures", "cyanosis"],
        "severity":    "moderate",
        "precautions": ["Isolate from infants", "Complete antibiotic course", "Vaccination"],
        "explanation": "Highly contagious bacterial infection caused by Bordetella pertussis.",
        "recommendations": ["DTaP/Tdap vaccination", "Antibiotics early in illness", "Humidifier"],
    },
    "Pleurisy": {
        "primary":     ["chest_pain", "shortness_of_breath", "dry_cough", "fever"],
        "secondary":   ["fatigue", "rapid_breathing", "shoulder_pain"],
        "rare":        ["hiccups"],
        "severity":    "moderate",
        "precautions": ["Rest", "Pain relievers", "Treat underlying cause", "Seek medical evaluation"],
        "explanation": "Inflammation of the tissue layers surrounding the lungs.",
        "recommendations": ["Anti-inflammatory medications", "Treat underlying infection", "Rest"],
    },

    # ── DIGESTIVE ─────────────────────────────────────────────────────────────
    "Gastroenteritis": {
        "primary":     ["nausea", "vomiting", "diarrhea", "abdominal_cramps", "mild_fever"],
        "secondary":   ["loss_of_appetite", "fatigue", "dehydration", "abdominal_pain"],
        "rare":        ["blood_in_stool", "muscle_cramps"],
        "severity":    "mild",
        "precautions": ["ORS for rehydration", "BRAT diet", "Avoid dairy and spicy food"],
        "explanation": "Inflammation of the stomach and intestines typically caused by viral or bacterial infection.",
        "recommendations": ["Probiotics after recovery", "Zinc supplements", "Gradual diet reintroduction"],
    },
    "GERD": {
        "primary":     ["heartburn", "acid_reflux", "chest_pain", "indigestion"],
        "secondary":   ["nausea", "bloating", "hoarseness", "sore_throat", "difficulty_swallowing"],
        "rare":        ["cough", "asthma_symptoms", "dental_erosion"],
        "severity":    "mild",
        "precautions": ["Avoid spicy and fatty foods", "Don't lie down after eating", "Elevate bed head"],
        "explanation": "Gastroesophageal reflux disease — stomach acid frequently flows back into esophagus.",
        "recommendations": ["Antacids or PPIs", "Small frequent meals", "Weight loss if overweight"],
    },
    "Peptic Ulcer": {
        "primary":     ["abdominal_pain", "heartburn", "nausea", "bloating", "loss_of_appetite"],
        "secondary":   ["vomiting", "black_stool", "blood_in_stool", "weight_loss"],
        "rare":        ["vomiting_blood", "fainting"],
        "severity":    "moderate",
        "precautions": ["Avoid NSAIDs and aspirin", "Avoid alcohol and smoking", "Eat small meals"],
        "explanation": "Open sores on stomach lining or small intestine. Often caused by H. pylori or NSAIDs.",
        "recommendations": ["H. pylori testing and treatment", "Proton pump inhibitors", "Stress reduction"],
    },
    "Appendicitis": {
        "primary":     ["abdominal_pain", "nausea", "vomiting", "fever", "loss_of_appetite"],
        "secondary":   ["chills", "diarrhea", "constipation", "abdominal_swelling"],
        "rare":        ["back_pain", "pelvic_pain"],
        "severity":    "severe",
        "precautions": ["Go to ER IMMEDIATELY", "Do not eat or drink", "Do not apply heat to abdomen"],
        "explanation": "Inflammation of the appendix — a medical emergency requiring surgery.",
        "recommendations": ["Emergency appendectomy", "Antibiotics pre-surgery", "Post-op care"],
    },
    "Irritable Bowel Syndrome": {
        "primary":     ["abdominal_cramps", "bloating", "diarrhea", "constipation", "gas"],
        "secondary":   ["abdominal_pain", "mucus_in_stool", "fatigue", "nausea"],
        "rare":        ["back_pain", "urinary_symptoms", "depression"],
        "severity":    "mild",
        "precautions": ["Identify trigger foods", "Eat regular small meals", "Reduce stress"],
        "explanation": "Functional bowel disorder causing cramping, abdominal pain, and altered bowel habits.",
        "recommendations": ["Low-FODMAP diet", "Probiotics", "Stress management techniques"],
    },
    "Gallstones": {
        "primary":     ["abdominal_pain", "nausea", "vomiting", "jaundice", "fever"],
        "secondary":   ["back_pain", "indigestion", "bloating", "loss_of_appetite"],
        "rare":        ["chills", "dark_urine", "pale_stool"],
        "severity":    "moderate",
        "precautions": ["Avoid high-fat meals", "Seek medical evaluation", "Monitor for worsening pain"],
        "explanation": "Hardened deposits in the gallbladder that can cause severe abdominal pain.",
        "recommendations": ["Low-fat diet", "Cholecystectomy if recurrent", "Ursodiol medication"],
    },
    "Food Poisoning": {
        "primary":     ["nausea", "vomiting", "diarrhea", "abdominal_cramps", "fever"],
        "secondary":   ["fatigue", "dehydration", "loss_of_appetite", "headache", "sweating"],
        "rare":        ["blood_in_stool", "muscle_weakness", "blurred_vision"],
        "severity":    "moderate",
        "precautions": ["Stay hydrated with ORS", "Rest", "Avoid solid food initially"],
        "explanation": "Illness caused by consuming contaminated food or water.",
        "recommendations": ["ORS fluids", "BRAT diet", "Medical attention if symptoms persist >48 hrs"],
    },
    "Celiac Disease": {
        "primary":     ["diarrhea", "abdominal_pain", "bloating", "weight_loss", "fatigue"],
        "secondary":   ["skin_rash", "anemia_symptoms", "constipation", "nausea", "joint_pain"],
        "rare":        ["depression", "mouth_ulcers", "bone_pain"],
        "severity":    "moderate",
        "precautions": ["Strict gluten-free diet", "Read food labels carefully", "Avoid cross-contamination"],
        "explanation": "Autoimmune disorder triggered by gluten consumption, damaging the small intestine.",
        "recommendations": ["Lifelong gluten-free diet", "Nutritional supplements", "Regular GI checkups"],
    },
    "Crohn's Disease": {
        "primary":     ["abdominal_pain", "diarrhea", "fatigue", "weight_loss", "fever"],
        "secondary":   ["blood_in_stool", "nausea", "loss_of_appetite", "joint_pain", "skin_lesions"],
        "rare":        ["eye_inflammation", "mouth_ulcers", "fistulas"],
        "severity":    "severe",
        "precautions": ["Follow prescribed medication plan", "Avoid trigger foods", "Manage stress"],
        "explanation": "Chronic inflammatory bowel disease affecting any part of the GI tract.",
        "recommendations": ["Immunosuppressive therapy", "Nutritional support", "Regular colonoscopy"],
    },
    "Hepatitis A": {
        "primary":     ["jaundice", "fatigue", "nausea", "abdominal_pain", "fever"],
        "secondary":   ["loss_of_appetite", "dark_urine", "pale_stool", "vomiting", "joint_pain"],
        "rare":        ["itching", "depression"],
        "severity":    "moderate",
        "precautions": ["Rest", "Avoid alcohol completely", "Stay hydrated", "Good hand hygiene"],
        "explanation": "Liver infection caused by hepatitis A virus, spread through contaminated food/water.",
        "recommendations": ["Hepatitis A vaccination", "Supportive care", "Avoid hepatotoxic drugs"],
    },
    "Hepatitis B": {
        "primary":     ["jaundice", "fatigue", "abdominal_pain", "nausea", "fever"],
        "secondary":   ["dark_urine", "joint_pain", "loss_of_appetite", "vomiting"],
        "rare":        ["skin_rash", "itching"],
        "severity":    "severe",
        "precautions": ["Avoid alcohol", "Safe sexual practices", "Don't share needles"],
        "explanation": "Serious liver infection caused by hepatitis B virus. Can become chronic.",
        "recommendations": ["Hepatitis B vaccination", "Antiviral medications", "Regular liver monitoring"],
    },

    # ── NEUROLOGICAL ──────────────────────────────────────────────────────────
    "Migraine": {
        "primary":     ["severe_headache", "nausea", "vomiting", "light_sensitivity", "sound_sensitivity"],
        "secondary":   ["blurred_vision", "dizziness", "fatigue", "neck_pain", "mood_swings"],
        "rare":        ["aura", "numbness", "tingling", "confusion"],
        "severity":    "moderate",
        "precautions": ["Rest in dark quiet room", "Cold compress", "Take medication at onset"],
        "explanation": "Neurological condition causing intense throbbing headaches, often on one side.",
        "recommendations": ["Identify triggers (diet, sleep, stress)", "Triptans", "Preventive medications"],
    },
    "Tension Headache": {
        "primary":     ["headache", "neck_pain", "fatigue", "neck_stiffness"],
        "secondary":   ["light_sensitivity", "poor_concentration", "irritability", "scalp_tenderness"],
        "rare":        ["nausea", "dizziness"],
        "severity":    "mild",
        "precautions": ["Rest", "OTC pain relievers", "Reduce stress", "Gentle neck stretches"],
        "explanation": "Most common type of headache causing dull, aching pressure around the head.",
        "recommendations": ["Stress management", "Regular sleep schedule", "Physical therapy"],
    },
    "Epilepsy": {
        "primary":     ["seizures", "confusion", "loss_of_consciousness", "tremors"],
        "secondary":   ["fatigue", "headache", "anxiety", "memory_loss"],
        "rare":        ["hallucinations", "mood_swings"],
        "severity":    "severe",
        "precautions": ["Take medications consistently", "Avoid seizure triggers", "Do not drive during active seizures"],
        "explanation": "Neurological disorder causing recurrent unprovoked seizures.",
        "recommendations": ["Anti-epileptic drugs (AEDs)", "Regular neurologist visits", "Medical alert bracelet"],
    },
    "Meningitis": {
        "primary":     ["neck_stiffness", "high_fever", "severe_headache", "confusion", "light_sensitivity"],
        "secondary":   ["nausea", "vomiting", "seizures", "skin_rash"],
        "rare":        ["hearing_loss", "coma"],
        "severity":    "severe",
        "precautions": ["EMERGENCY — go to ER immediately", "Antibiotics must be started immediately"],
        "explanation": "Life-threatening inflammation of membranes surrounding the brain and spinal cord.",
        "recommendations": ["Immediate IV antibiotics", "ICU care", "Meningitis vaccination"],
    },
    "Stroke": {
        "primary":     ["sudden_numbness", "confusion", "difficulty_speaking", "blurred_vision", "severe_headache"],
        "secondary":   ["dizziness", "loss_of_balance", "facial_drooping", "arm_weakness"],
        "rare":        ["seizures", "hiccups"],
        "severity":    "severe",
        "precautions": ["EMERGENCY — call 911 immediately", "Note time symptoms started", "Do not give food/water"],
        "explanation": "Medical emergency where blood supply to part of brain is cut off.",
        "recommendations": ["Immediate thrombolysis if ischemic", "Stroke unit care", "Rehabilitation"],
    },
    "Parkinson's Disease": {
        "primary":     ["tremors", "muscle_stiffness", "slow_movement", "balance_problems"],
        "secondary":   ["fatigue", "depression", "insomnia", "memory_loss", "constipation"],
        "rare":        ["hallucinations", "dementia", "pain"],
        "severity":    "severe",
        "precautions": ["Take medications on schedule", "Fall prevention measures", "Physical therapy"],
        "explanation": "Progressive nervous system disorder affecting movement.",
        "recommendations": ["Levodopa therapy", "Exercise program", "Occupational therapy"],
    },
    "Multiple Sclerosis": {
        "primary":     ["fatigue", "numbness", "blurred_vision", "muscle_weakness", "tingling"],
        "secondary":   ["dizziness", "difficulty_walking", "bladder_problems", "depression", "tremors"],
        "rare":        ["slurred_speech", "swallowing_difficulty", "seizures"],
        "severity":    "severe",
        "precautions": ["Avoid overheating", "Take prescribed disease-modifying therapies", "Regular physiotherapy"],
        "explanation": "Disease where immune system attacks the myelin sheath protecting nerve fibers.",
        "recommendations": ["Disease-modifying therapy", "Physical rehabilitation", "Vitamin D supplementation"],
    },
    "Alzheimer's Disease": {
        "primary":     ["memory_loss", "confusion", "poor_concentration", "mood_swings", "disorientation"],
        "secondary":   ["depression", "social_withdrawal", "insomnia", "paranoia", "agitation"],
        "rare":        ["seizures", "hallucinations", "swallowing_difficulty"],
        "severity":    "severe",
        "precautions": ["Structured daily routine", "Safe home environment", "Caregiver support"],
        "explanation": "Progressive neurodegenerative disease causing memory loss and cognitive decline.",
        "recommendations": ["Cholinesterase inhibitors", "Cognitive stimulation therapy", "Caregiver education"],
    },

    # ── CARDIOVASCULAR ────────────────────────────────────────────────────────
    "Hypertension": {
        "primary":     ["headache", "dizziness", "palpitations", "blurred_vision", "fatigue"],
        "secondary":   ["nausea", "chest_pain", "shortness_of_breath", "nosebleed"],
        "rare":        ["confusion", "vision_problems"],
        "severity":    "moderate",
        "precautions": ["Monitor BP daily", "Reduce sodium intake", "Exercise regularly", "Take medications consistently"],
        "explanation": "Chronically elevated blood pressure that increases risk of heart attack and stroke.",
        "recommendations": ["Low-sodium DASH diet", "30 min aerobic exercise 5x/week", "Antihypertensive medications"],
    },
    "Hypotension": {
        "primary":     ["dizziness", "fainting", "weakness", "blurred_vision", "fatigue"],
        "secondary":   ["nausea", "pale_skin", "rapid_heartbeat", "cold_skin", "poor_concentration"],
        "rare":        ["depression", "thirst"],
        "severity":    "mild",
        "precautions": ["Stand up slowly", "Stay hydrated", "Avoid prolonged standing", "Wear compression stockings"],
        "explanation": "Abnormally low blood pressure that can cause dizziness and fainting.",
        "recommendations": ["Increase fluid and salt intake", "Small frequent meals", "Elevation stockings"],
    },
    "Coronary Artery Disease": {
        "primary":     ["chest_pain", "chest_pressure", "shortness_of_breath", "arm_pain", "jaw_pain"],
        "secondary":   ["fatigue", "palpitations", "dizziness", "nausea", "sweating"],
        "rare":        ["indigestion", "heartburn"],
        "severity":    "severe",
        "precautions": ["Emergency care if chest pain", "Take prescribed medications", "Cardiac rehabilitation"],
        "explanation": "Plaque buildup in coronary arteries reducing blood flow to the heart.",
        "recommendations": ["Statins", "Aspirin therapy", "Cardiac rehabilitation", "Low-fat diet"],
    },
    "Heart Failure": {
        "primary":     ["shortness_of_breath", "fatigue", "swollen_feet", "rapid_heartbeat", "weakness"],
        "secondary":   ["persistent_cough", "nausea", "loss_of_appetite", "weight_gain", "swelling"],
        "rare":        ["confusion", "chest_pain"],
        "severity":    "severe",
        "precautions": ["Fluid restriction", "Daily weight monitoring", "Sodium restriction", "Take diuretics"],
        "explanation": "Heart cannot pump enough blood to meet body's needs.",
        "recommendations": ["ACE inhibitors", "Beta blockers", "Diuretics", "Low-sodium diet"],
    },
    "Atrial Fibrillation": {
        "primary":     ["irregular_heartbeat", "palpitations", "shortness_of_breath", "fatigue", "dizziness"],
        "secondary":   ["chest_pain", "weakness", "fainting", "sweating"],
        "rare":        ["confusion", "stroke_symptoms"],
        "severity":    "moderate",
        "precautions": ["Take anticoagulants as prescribed", "Avoid caffeine and alcohol", "Monitor pulse"],
        "explanation": "Irregular and often rapid heart rate that can cause stroke and heart failure.",
        "recommendations": ["Anticoagulation therapy", "Rate or rhythm control", "Lifestyle modification"],
    },

    # ── ENDOCRINE ─────────────────────────────────────────────────────────────
    "Diabetes Type 1": {
        "primary":     ["frequent_urination", "excessive_thirst", "weight_loss", "fatigue", "blurred_vision"],
        "secondary":   ["nausea", "abdominal_pain", "vomiting", "fruity_breath", "mood_swings"],
        "rare":        ["seizures", "loss_of_consciousness"],
        "severity":    "severe",
        "precautions": ["Take insulin exactly as prescribed", "Monitor blood glucose regularly", "Carry glucose tablets"],
        "explanation": "Autoimmune destruction of insulin-producing pancreatic beta cells.",
        "recommendations": ["Insulin therapy", "Continuous glucose monitoring", "Carbohydrate counting"],
    },
    "Diabetes Type 2": {
        "primary":     ["frequent_urination", "excessive_thirst", "fatigue", "blurred_vision", "slow_healing"],
        "secondary":   ["weight_gain", "frequent_infections", "numbness", "tingling", "excessive_hunger"],
        "rare":        ["skin_discoloration", "dark_patches"],
        "severity":    "moderate",
        "precautions": ["Monitor blood glucose daily", "Low-carb balanced diet", "Regular exercise", "Take medications"],
        "explanation": "Insulin resistance leading to elevated blood glucose. Often lifestyle-related.",
        "recommendations": ["Metformin", "Low-carb diet", "Weight loss", "Regular A1C monitoring"],
    },
    "Hypothyroidism": {
        "primary":     ["fatigue", "weight_gain", "cold_intolerance", "constipation", "depression"],
        "secondary":   ["hair_thinning", "dry_skin", "puffy_face", "muscle_weakness", "slow_heartbeat"],
        "rare":        ["memory_loss", "brittle_nails", "joint_pain"],
        "severity":    "moderate",
        "precautions": ["Take levothyroxine consistently", "Regular TSH blood tests", "Avoid soy and high-fiber near medication"],
        "explanation": "Underactive thyroid gland producing insufficient thyroid hormones.",
        "recommendations": ["Levothyroxine replacement", "Regular thyroid function tests", "Selenium-rich diet"],
    },
    "Hyperthyroidism": {
        "primary":     ["weight_loss", "rapid_heartbeat", "heat_intolerance", "excessive_sweating", "anxiety"],
        "secondary":   ["tremors", "fatigue", "irritability", "diarrhea", "hair_loss"],
        "rare":        ["eye_problems", "palpitations", "insomnia"],
        "severity":    "moderate",
        "precautions": ["Take antithyroid medications", "Avoid iodine-rich foods", "Regular thyroid monitoring"],
        "explanation": "Overactive thyroid producing too much thyroxine hormone.",
        "recommendations": ["Antithyroid drugs", "Radioactive iodine therapy", "Beta blockers for symptoms"],
    },
    "Cushing's Syndrome": {
        "primary":     ["weight_gain", "rapid_weight_gain", "skin_discoloration", "bruising", "fatigue"],
        "secondary":   ["muscle_weakness", "high_blood_pressure", "depression", "insomnia", "poor_concentration"],
        "rare":        ["excessive_hair_growth", "menstrual_problems", "bone_loss"],
        "severity":    "severe",
        "precautions": ["Medical evaluation required", "Do not stop steroid medications abruptly"],
        "explanation": "Disorder caused by prolonged exposure to high cortisol levels.",
        "recommendations": ["Taper corticosteroids slowly", "Adrenal surgery if tumor", "Cortisol-blocking medications"],
    },
    "Polycystic Ovary Syndrome": {
        "primary":     ["irregular_periods", "weight_gain", "acne", "hair_loss", "excessive_hair_growth"],
        "secondary":   ["fatigue", "mood_swings", "depression", "pelvic_pain", "skin_discoloration"],
        "rare":        ["sleep_apnea", "frequent_urination"],
        "severity":    "moderate",
        "precautions": ["Maintain healthy weight", "Regular exercise", "Low-glycemic diet"],
        "explanation": "Hormonal disorder in women causing enlarged ovaries with small cysts.",
        "recommendations": ["Oral contraceptives", "Metformin", "Lifestyle modification", "Fertility treatment if needed"],
    },

    # ── INFECTIOUS DISEASES ───────────────────────────────────────────────────
    "Malaria": {
        "primary":     ["high_fever", "chills", "sweating", "headache", "body_aches"],
        "secondary":   ["nausea", "vomiting", "fatigue", "diarrhea", "abdominal_pain"],
        "rare":        ["jaundice", "confusion", "seizures"],
        "severity":    "severe",
        "precautions": ["Seek immediate medical evaluation", "Take full antimalarial course", "Use mosquito nets"],
        "explanation": "Mosquito-borne parasitic infection caused by Plasmodium species.",
        "recommendations": ["Artemisinin-based therapy", "Prophylaxis when traveling", "Mosquito repellent"],
    },
    "Dengue Fever": {
        "primary":     ["high_fever", "severe_headache", "joint_pain", "body_aches", "skin_rash"],
        "secondary":   ["nausea", "vomiting", "fatigue", "chills", "eye_pain"],
        "rare":        ["bleeding_gums", "blood_in_urine", "bruising"],
        "severity":    "severe",
        "precautions": ["Hospital evaluation required", "Monitor platelet count daily", "DO NOT take NSAIDs or aspirin"],
        "explanation": "Mosquito-borne viral infection with risk of hemorrhagic fever.",
        "recommendations": ["Platelet monitoring", "IV fluids if severe", "Paracetamol only for fever"],
    },
    "Typhoid Fever": {
        "primary":     ["high_fever", "headache", "fatigue", "abdominal_pain", "loss_of_appetite"],
        "secondary":   ["constipation", "diarrhea", "sweating", "cough", "skin_rash"],
        "rare":        ["confusion", "intestinal_bleeding"],
        "severity":    "severe",
        "precautions": ["Start antibiotics immediately", "Drink only boiled/bottled water", "Eat thoroughly cooked food"],
        "explanation": "Bacterial infection caused by Salmonella typhi from contaminated food/water.",
        "recommendations": ["Ciprofloxacin or ceftriaxone", "Typhoid vaccination", "Food and water hygiene"],
    },
    "Chickenpox": {
        "primary":     ["skin_rash", "itching", "fever", "blisters", "fatigue"],
        "secondary":   ["loss_of_appetite", "headache", "malaise", "sore_throat"],
        "rare":        ["pneumonia", "encephalitis"],
        "severity":    "mild",
        "precautions": ["Isolate from others", "Calamine lotion for itching", "Trim nails to avoid scratching"],
        "explanation": "Highly contagious viral infection caused by varicella-zoster virus.",
        "recommendations": ["Varicella vaccination", "Antihistamines for itching", "Antiviral in severe cases"],
    },
    "Measles": {
        "primary":     ["high_fever", "skin_rash", "cough", "runny_nose", "red_eyes"],
        "secondary":   ["light_sensitivity", "fatigue", "white_patches_throat", "loss_of_appetite"],
        "rare":        ["pneumonia", "encephalitis", "ear_infection"],
        "severity":    "moderate",
        "precautions": ["Isolate immediately", "Vitamin A supplementation", "Report to public health"],
        "explanation": "Highly contagious viral infection preventable by MMR vaccination.",
        "recommendations": ["MMR vaccination", "Vitamin A supplements", "Supportive care"],
    },
    "Mumps": {
        "primary":     ["swollen_face", "fever", "headache", "fatigue", "loss_of_appetite"],
        "secondary":   ["muscle_pain", "swollen_lymph_nodes", "jaw_pain", "difficulty_swallowing"],
        "rare":        ["testicular_pain", "hearing_loss", "meningitis"],
        "severity":    "moderate",
        "precautions": ["Isolate for 5 days after swelling starts", "Soft foods", "Pain relievers"],
        "explanation": "Contagious viral infection primarily affecting the parotid salivary glands.",
        "recommendations": ["MMR vaccination", "Pain management", "Warm or cold compress to jaw"],
    },
    "HIV/AIDS": {
        "primary":     ["fatigue", "weight_loss", "frequent_infections", "swollen_lymph_nodes", "fever"],
        "secondary":   ["night_sweats", "skin_rash", "diarrhea", "oral_ulcers", "cough"],
        "rare":        ["neurological_symptoms", "vision_loss", "wasting"],
        "severity":    "severe",
        "precautions": ["Take ART medications consistently", "Practice safe sex", "Regular CD4 monitoring"],
        "explanation": "Virus attacking immune system CD4 cells, leading to AIDS if untreated.",
        "recommendations": ["Antiretroviral therapy (ART)", "PrEP for prevention", "Regular viral load monitoring"],
    },
    "Lyme Disease": {
        "primary":     ["skin_rash", "fatigue", "fever", "headache", "muscle_pain"],
        "secondary":   ["joint_pain", "neck_stiffness", "swollen_lymph_nodes", "chills"],
        "rare":        ["facial_palsy", "palpitations", "memory_loss"],
        "severity":    "moderate",
        "precautions": ["Complete full antibiotic course", "Tick removal properly", "Check for ticks after outdoors"],
        "explanation": "Tick-borne bacterial infection caused by Borrelia burgdorferi.",
        "recommendations": ["Doxycycline antibiotics", "Tick prevention measures", "DEET repellent"],
    },

    # ── SKIN DISEASES ─────────────────────────────────────────────────────────
    "Psoriasis": {
        "primary":     ["skin_rash", "skin_peeling", "itching", "skin_redness", "dry_skin"],
        "secondary":   ["joint_pain", "nail_changes", "fatigue", "skin_warmth"],
        "rare":        ["eye_inflammation", "depression"],
        "severity":    "moderate",
        "precautions": ["Moisturize regularly", "Avoid triggers (stress, alcohol)", "Gentle skin care"],
        "explanation": "Autoimmune skin disease causing rapid skin cell buildup forming scaly patches.",
        "recommendations": ["Topical corticosteroids", "Biologic agents", "Phototherapy", "Stress reduction"],
    },
    "Eczema": {
        "primary":     ["itching", "dry_skin", "skin_rash", "skin_redness", "blisters"],
        "secondary":   ["skin_peeling", "swelling", "skin_warmth", "sleep_problems"],
        "rare":        ["skin_infections", "eye_complications"],
        "severity":    "mild",
        "precautions": ["Moisturize twice daily", "Avoid known triggers", "Use fragrance-free products", "Keep nails short"],
        "explanation": "Chronic inflammatory skin condition causing itchy, inflamed skin.",
        "recommendations": ["Emollients", "Topical corticosteroids", "Antihistamines for itching", "Identify triggers"],
    },
    "Acne": {
        "primary":     ["acne", "skin_redness", "oily_skin", "skin_lesions", "pimples"],
        "secondary":   ["skin_pain", "scarring", "blackheads", "whiteheads"],
        "rare":        ["depression", "anxiety"],
        "severity":    "mild",
        "precautions": ["Wash face twice daily", "Avoid touching face", "Use non-comedogenic products"],
        "explanation": "Common skin condition caused by hair follicles plugged with oil and dead skin cells.",
        "recommendations": ["Benzoyl peroxide", "Retinoids", "Antibiotics for severe cases", "Isotretinoin"],
    },
    "Ringworm": {
        "primary":     ["skin_rash", "itching", "skin_redness", "circular_rash", "skin_peeling"],
        "secondary":   ["hair_loss", "nail_changes", "blisters"],
        "rare":        ["fever", "swollen_lymph_nodes"],
        "severity":    "mild",
        "precautions": ["Keep affected area dry", "Avoid sharing towels", "Antifungal cream"],
        "explanation": "Fungal skin infection causing ring-shaped rash despite its name.",
        "recommendations": ["Topical antifungals", "Keep skin dry", "Wash bedding regularly"],
    },
    "Urticaria": {
        "primary":     ["hives", "itching", "skin_redness", "swelling", "skin_rash"],
        "secondary":   ["burning_sensation", "difficulty_breathing", "swollen_face"],
        "rare":        ["anaphylaxis", "joint_pain"],
        "severity":    "moderate",
        "precautions": ["Identify and avoid triggers", "Antihistamines", "Seek emergency care if breathing affected"],
        "explanation": "Raised, itchy welts on the skin triggered by allergic reactions.",
        "recommendations": ["Antihistamines", "Identify allergen triggers", "Epinephrine for severe reactions"],
    },
    "Cellulitis": {
        "primary":     ["skin_redness", "skin_warmth", "swelling", "skin_pain", "fever"],
        "secondary":   ["skin_rash", "fatigue", "chills", "blisters"],
        "rare":        ["red_streaks", "pus_discharge", "swollen_lymph_nodes"],
        "severity":    "moderate",
        "precautions": ["Antibiotics required", "Elevate affected area", "Keep wound clean and covered"],
        "explanation": "Bacterial skin infection causing red, swollen, warm and tender skin.",
        "recommendations": ["Oral or IV antibiotics", "Wound care", "Monitor for spreading redness"],
    },
    "Shingles": {
        "primary":     ["skin_rash", "blisters", "skin_pain", "itching", "burning_sensation"],
        "secondary":   ["fever", "fatigue", "headache", "light_sensitivity", "chills"],
        "rare":        ["vision_loss", "hearing_loss", "facial_paralysis"],
        "severity":    "moderate",
        "precautions": ["Start antiviral within 72 hrs", "Keep rash covered", "Avoid contact with immunocompromised"],
        "explanation": "Reactivation of varicella-zoster virus causing painful skin rash.",
        "recommendations": ["Acyclovir or valacyclovir", "Pain management", "Shingrix vaccine for prevention"],
    },

    # ── MENTAL HEALTH ─────────────────────────────────────────────────────────
    "Depression": {
        "primary":     ["depression", "fatigue", "insomnia", "social_withdrawal", "poor_concentration"],
        "secondary":   ["weight_loss", "weight_gain", "mood_swings", "irritability", "excessive_sleep"],
        "rare":        ["hallucinations", "paranoia", "suicidal_thoughts"],
        "severity":    "moderate",
        "precautions": ["Seek mental health professional", "Do not stop medications abruptly", "Maintain social connections"],
        "explanation": "Mood disorder causing persistent sadness and loss of interest.",
        "recommendations": ["CBT therapy", "Antidepressants (SSRIs)", "Exercise", "Social support"],
    },
    "Anxiety Disorder": {
        "primary":     ["anxiety", "palpitations", "excessive_sweating", "tremors", "shortness_of_breath"],
        "secondary":   ["insomnia", "fatigue", "poor_concentration", "muscle_tension", "irritability"],
        "rare":        ["panic_attacks", "depersonalization", "nausea"],
        "severity":    "moderate",
        "precautions": ["Practice breathing exercises", "Limit caffeine", "Regular exercise", "Seek therapy"],
        "explanation": "Persistent excessive worry or fear interfering with daily activities.",
        "recommendations": ["CBT therapy", "SSRIs or SNRIs", "Mindfulness meditation", "Avoid caffeine"],
    },
    "Panic Disorder": {
        "primary":     ["panic_attacks", "palpitations", "chest_pain", "shortness_of_breath", "dizziness"],
        "secondary":   ["sweating", "tremors", "numbness", "nausea", "fear_of_dying"],
        "rare":        ["fainting", "hot_flashes", "chills"],
        "severity":    "moderate",
        "precautions": ["Breathing techniques during attack", "Avoid avoidance behaviors", "Seek CBT therapy"],
        "explanation": "Recurring unexpected panic attacks causing significant behavioral changes.",
        "recommendations": ["CBT therapy", "Exposure therapy", "SSRIs", "Benzodiazepines short-term"],
    },
    "Bipolar Disorder": {
        "primary":     ["mood_swings", "irritability", "insomnia", "excessive_energy", "depression"],
        "secondary":   ["poor_concentration", "impulsivity", "grandiosity", "excessive_sleep", "weight_changes"],
        "rare":        ["hallucinations", "paranoia", "suicidal_thoughts"],
        "severity":    "severe",
        "precautions": ["Take mood stabilizers consistently", "Regular psychiatric monitoring", "Avoid alcohol and drugs"],
        "explanation": "Mental disorder with extreme mood swings including manic and depressive episodes.",
        "recommendations": ["Lithium or valproate", "CBT therapy", "Sleep schedule regulation"],
    },
    "PTSD": {
        "primary":     ["nightmares", "anxiety", "insomnia", "social_withdrawal", "poor_concentration"],
        "secondary":   ["depression", "irritability", "paranoia", "mood_swings", "fatigue"],
        "rare":        ["hallucinations", "dissociation", "suicidal_thoughts"],
        "severity":    "moderate",
        "precautions": ["Seek trauma-informed therapy", "Build support network", "Avoid substance use"],
        "explanation": "Mental health condition triggered by experiencing or witnessing a terrifying event.",
        "recommendations": ["EMDR therapy", "Prolonged exposure therapy", "SSRIs", "Support groups"],
    },
    "OCD": {
        "primary":     ["anxiety", "poor_concentration", "compulsive_behaviors", "intrusive_thoughts"],
        "secondary":   ["insomnia", "depression", "fatigue", "social_withdrawal"],
        "rare":        ["skin_lesions_from_compulsions", "hair_loss"],
        "severity":    "moderate",
        "precautions": ["ERP therapy is gold standard", "Do not avoid triggers completely", "Take prescribed medications"],
        "explanation": "Anxiety disorder with uncontrollable recurring thoughts and repetitive behaviors.",
        "recommendations": ["Exposure response prevention (ERP)", "SSRIs (fluvoxamine)", "CBT therapy"],
    },
    "Schizophrenia": {
        "primary":     ["hallucinations", "paranoia", "confusion", "social_withdrawal", "flat_affect"],
        "secondary":   ["insomnia", "poor_concentration", "depression", "disorganized_speech"],
        "rare":        ["catatonia", "self_harm"],
        "severity":    "severe",
        "precautions": ["Never stop antipsychotics without medical guidance", "Regular psychiatric care", "Family support"],
        "explanation": "Serious mental disorder affecting thinking, feeling, and behavior.",
        "recommendations": ["Antipsychotic medications", "Psychosocial rehabilitation", "Family therapy"],
    },

    # ── MUSCULOSKELETAL ───────────────────────────────────────────────────────
    "Rheumatoid Arthritis": {
        "primary":     ["joint_pain", "joint_swelling", "morning_stiffness", "fatigue", "joint_stiffness"],
        "secondary":   ["fever", "weight_loss", "anemia_symptoms", "swollen_lymph_nodes"],
        "rare":        ["eye_inflammation", "chest_pain", "skin_nodules"],
        "severity":    "moderate",
        "precautions": ["Take DMARDs as prescribed", "Regular exercise", "Joint protection techniques"],
        "explanation": "Autoimmune disorder causing chronic inflammation of joints.",
        "recommendations": ["Methotrexate", "Biologics", "Physical therapy", "Anti-inflammatory diet"],
    },
    "Osteoarthritis": {
        "primary":     ["joint_pain", "joint_stiffness", "swollen_joints", "reduced_range_of_motion"],
        "secondary":   ["muscle_weakness", "fatigue", "bone_pain", "joint_cracking"],
        "rare":        ["joint_deformity"],
        "severity":    "moderate",
        "precautions": ["Weight management", "Low-impact exercise", "Joint-protective movement"],
        "explanation": "Degenerative joint disease from cartilage breakdown, most common form of arthritis.",
        "recommendations": ["NSAIDs", "Physical therapy", "Weight loss", "Glucosamine supplements"],
    },
    "Gout": {
        "primary":     ["joint_pain", "joint_swelling", "joint_redness", "skin_warmth", "skin_redness"],
        "secondary":   ["fever", "fatigue", "limited_movement"],
        "rare":        ["kidney_stones", "tophi"],
        "severity":    "moderate",
        "precautions": ["Avoid purine-rich foods (organ meats, shellfish)", "Stay hydrated", "Limit alcohol"],
        "explanation": "Painful form of inflammatory arthritis caused by urate crystal accumulation in joints.",
        "recommendations": ["Colchicine during attack", "Allopurinol for prevention", "Low-purine diet"],
    },
    "Fibromyalgia": {
        "primary":     ["muscle_pain", "fatigue", "insomnia", "poor_concentration", "morning_stiffness"],
        "secondary":   ["headache", "depression", "anxiety", "numbness", "tingling"],
        "rare":        ["restless_legs", "temperature_sensitivity"],
        "severity":    "moderate",
        "precautions": ["Pace activities", "Regular gentle exercise", "Sleep hygiene"],
        "explanation": "Disorder with widespread musculoskeletal pain, fatigue, sleep, and cognitive issues.",
        "recommendations": ["Duloxetine or pregabalin", "Low-impact exercise", "CBT therapy", "Sleep improvement"],
    },
    "Osteoporosis": {
        "primary":     ["bone_pain", "back_pain", "fractures", "height_loss", "poor_posture"],
        "secondary":   ["fatigue", "muscle_weakness"],
        "rare":        ["hip_fracture", "spinal_compression"],
        "severity":    "moderate",
        "precautions": ["Fall prevention", "Take calcium and vitamin D", "Weight-bearing exercise"],
        "explanation": "Condition where bones become weak and brittle, increasing fracture risk.",
        "recommendations": ["Bisphosphonates", "Calcium + Vitamin D", "Resistance exercise", "DEXA scans"],
    },

    # ── KIDNEY & URINARY ──────────────────────────────────────────────────────
    "Urinary Tract Infection": {
        "primary":     ["painful_urination", "frequent_urination", "cloudy_urine", "pelvic_pain", "fever"],
        "secondary":   ["blood_in_urine", "back_pain", "fatigue", "nausea", "chills"],
        "rare":        ["vomiting", "confusion"],
        "severity":    "moderate",
        "precautions": ["Complete antibiotic course", "Drink 8-10 glasses water daily", "Avoid caffeine"],
        "explanation": "Bacterial infection of the urinary system, more common in women.",
        "recommendations": ["Trimethoprim-sulfamethoxazole or nitrofurantoin", "Increased fluid intake", "Cranberry supplements"],
    },
    "Kidney Stones": {
        "primary":     ["severe_back_pain", "flank_pain", "painful_urination", "blood_in_urine", "nausea"],
        "secondary":   ["vomiting", "fever", "chills", "frequent_urination", "cloudy_urine"],
        "rare":        ["reduced_urination"],
        "severity":    "severe",
        "precautions": ["Drink plenty of water", "Pain management", "Medical evaluation for large stones"],
        "explanation": "Hard deposits made of minerals and salts that form inside kidneys.",
        "recommendations": ["Pain management", "Increased fluid intake", "Lithotripsy for large stones", "Low-oxalate diet"],
    },
    "Chronic Kidney Disease": {
        "primary":     ["fatigue", "reduced_urination", "swelling", "nausea", "loss_of_appetite"],
        "secondary":   ["shortness_of_breath", "confusion", "itching", "muscle_cramps", "anemia_symptoms"],
        "rare":        ["seizures", "pericarditis"],
        "severity":    "severe",
        "precautions": ["Control blood pressure and diabetes", "Low-protein diet", "Avoid NSAIDs"],
        "explanation": "Gradual loss of kidney function over months or years.",
        "recommendations": ["ACE inhibitors", "Dialysis when needed", "Low-protein diet", "Regular eGFR monitoring"],
    },

    # ── EYE DISEASES ──────────────────────────────────────────────────────────
    "Conjunctivitis": {
        "primary":     ["red_eyes", "watery_eyes", "eye_pain", "itching", "swollen_eyelids"],
        "secondary":   ["discharge_from_eye", "light_sensitivity", "blurred_vision"],
        "rare":        ["fever", "swollen_lymph_nodes"],
        "severity":    "mild",
        "precautions": ["Wash hands frequently", "Don't touch eyes", "Don't share towels or pillowcases"],
        "explanation": "Inflammation of the conjunctiva — the clear tissue covering the white part of the eye.",
        "recommendations": ["Antibiotic eye drops if bacterial", "Antihistamine drops if allergic", "Cold compress"],
    },
    "Glaucoma": {
        "primary":     ["blurred_vision", "eye_pain", "headache", "halos_around_lights"],
        "secondary":   ["nausea", "vomiting", "redness_of_eye"],
        "rare":        ["sudden_vision_loss"],
        "severity":    "severe",
        "precautions": ["Regular eye pressure checks", "Take eye drops as prescribed", "Annual eye exams"],
        "explanation": "Group of eye conditions damaging the optic nerve, often from increased eye pressure.",
        "recommendations": ["Eye pressure-lowering drops", "Laser therapy", "Surgery if medication fails"],
    },
    "Cataracts": {
        "primary":     ["blurred_vision", "double_vision", "light_sensitivity", "halos_around_lights"],
        "secondary":   ["poor_night_vision", "fading_colors"],
        "rare":        ["rapid_vision_changes"],
        "severity":    "moderate",
        "precautions": ["Wear UV-protective sunglasses", "Regular eye exams", "Adequate lighting"],
        "explanation": "Clouding of the normally clear lens of the eye.",
        "recommendations": ["Surgical lens replacement", "Strong eyeglass prescription initially", "UV protection"],
    },

    # ── OTHER COMMON CONDITIONS ────────────────────────────────────────────────
    "Anemia": {
        "primary":     ["fatigue", "weakness", "pale_skin", "shortness_of_breath", "dizziness"],
        "secondary":   ["palpitations", "headache", "cold_hands", "chest_pain", "brittle_nails"],
        "rare":        ["swollen_tongue", "restless_legs", "fainting"],
        "severity":    "moderate",
        "precautions": ["Iron-rich diet", "Take iron supplements with vitamin C", "Avoid coffee/tea with meals"],
        "explanation": "Condition where lack of healthy red blood cells reduces oxygen delivery to tissues.",
        "recommendations": ["Iron supplements", "B12 injections if pernicious anemia", "Treat underlying cause"],
    },
    "Dehydration": {
        "primary":     ["excessive_thirst", "dry_mouth", "fatigue", "dizziness", "reduced_urination"],
        "secondary":   ["headache", "confusion", "rapid_heartbeat", "muscle_cramps", "dark_urine"],
        "rare":        ["fainting", "seizures"],
        "severity":    "moderate",
        "precautions": ["Drink water or ORS immediately", "Avoid caffeine and alcohol", "Cool environment"],
        "explanation": "Occurs when body uses or loses more fluids than it takes in.",
        "recommendations": ["ORS fluids", "IV fluids if severe", "Gradual rehydration", "Electrolyte drinks"],
    },
    "Obesity": {
        "primary":     ["weight_gain", "fatigue", "shortness_of_breath", "joint_pain", "excessive_sweating"],
        "secondary":   ["back_pain", "depression", "insomnia", "sleep_apnea", "skin_problems"],
        "rare":        ["fatty_liver", "GERD"],
        "severity":    "moderate",
        "precautions": ["Caloric deficit diet", "Regular physical activity", "Behavioral counseling"],
        "explanation": "Complex disease involving excessive body fat that increases health risk.",
        "recommendations": ["Structured diet plan", "Exercise program", "Behavioral therapy", "Bariatric surgery if severe"],
    },
    "Sepsis": {
        "primary":     ["high_fever", "rapid_heartbeat", "rapid_breathing", "confusion", "extreme_fatigue"],
        "secondary":   ["chills", "low_blood_pressure", "pale_skin", "decreased_urination"],
        "rare":        ["organ_failure", "septic_shock"],
        "severity":    "severe",
        "precautions": ["EMERGENCY — call 911 immediately", "IV antibiotics must be started immediately"],
        "explanation": "Life-threatening organ dysfunction caused by dysregulated response to infection.",
        "recommendations": ["Immediate IV antibiotics", "ICU care", "Vasopressors if in shock", "Source control"],
    },
    "Hypothermia": {
        "primary":     ["shivering", "confusion", "fatigue", "pale_skin", "slow_heartbeat"],
        "secondary":   ["slurred_speech", "poor_coordination", "cold_skin", "drowsiness"],
        "rare":        ["cardiac_arrest"],
        "severity":    "severe",
        "precautions": ["EMERGENCY — warm patient immediately", "Remove wet clothing", "Warm blankets"],
        "explanation": "Dangerous drop in body temperature below 35°C (95°F).",
        "recommendations": ["Gradual rewarming", "Warm IV fluids", "Cardiac monitoring", "Warm humidified oxygen"],
    },
    "Heat Stroke": {
        "primary":     ["high_fever", "confusion", "rapid_heartbeat", "hot_dry_skin", "nausea"],
        "secondary":   ["vomiting", "headache", "fainting", "rapid_breathing", "muscle_cramps"],
        "rare":        ["seizures", "organ_failure"],
        "severity":    "severe",
        "precautions": ["EMERGENCY — cool immediately", "Move to cool environment", "Call 911"],
        "explanation": "Core body temperature rises above 40°C (104°F) due to heat exposure.",
        "recommendations": ["Rapid cooling with ice packs", "IV fluids", "ICU monitoring"],
    },
    "Lupus": {
        "primary":     ["joint_pain", "skin_rash", "fatigue", "fever", "light_sensitivity"],
        "secondary":   ["hair_loss", "chest_pain", "shortness_of_breath", "kidney_problems", "depression"],
        "rare":        ["seizures", "psychosis", "anemia_symptoms"],
        "severity":    "severe",
        "precautions": ["Avoid sun exposure", "Take hydroxychloroquine as prescribed", "Regular kidney monitoring"],
        "explanation": "Autoimmune disease where immune system attacks the body's own tissues.",
        "recommendations": ["Hydroxychloroquine", "Corticosteroids", "Immunosuppressants", "Sun protection"],
    },
    "Sleep Apnea": {
        "primary":     ["snoring", "excessive_sleep", "fatigue", "insomnia", "poor_concentration"],
        "secondary":   ["headache", "irritability", "depression", "palpitations", "night_sweats"],
        "rare":        ["hypertension", "heart_disease"],
        "severity":    "moderate",
        "precautions": ["CPAP therapy", "Sleep on side", "Weight loss if obese"],
        "explanation": "Disorder causing breathing repeatedly stops and starts during sleep.",
        "recommendations": ["CPAP machine", "Weight loss", "Positional therapy", "Avoid alcohol before bed"],
    },
    "Anaphylaxis": {
        "primary":     ["hives", "swollen_face", "difficulty_breathing", "palpitations", "dizziness"],
        "secondary":   ["nausea", "vomiting", "pale_skin", "anxiety", "confusion"],
        "rare":        ["cardiac_arrest", "seizures"],
        "severity":    "severe",
        "precautions": ["EMERGENCY — administer epinephrine immediately", "Call 911", "Lie down with legs elevated"],
        "explanation": "Severe, life-threatening allergic reaction requiring immediate emergency treatment.",
        "recommendations": ["Epinephrine (EpiPen)", "Antihistamines after epinephrine", "Allergen avoidance"],
    },
}

def get_all_symptoms():
    return SYMPTOMS

def get_all_diseases():
    return list(DISEASE_DB.keys())

def generate_dataset(samples_per_disease=500):
    """
    Generate synthetic training data.
    Returns: X (feature matrix), y (labels), feature_names
    """
    symptom_to_idx = {s: i for i, s in enumerate(SYMPTOMS)}
    n_symptoms = len(SYMPTOMS)

    # Extra features: symptom_count, age_group_child, age_group_adult, age_group_elderly, duration
    X, y = [], []

    for disease, info in DISEASE_DB.items():
        primary   = [s for s in info.get("primary", [])   if s in symptom_to_idx]
        secondary = [s for s in info.get("secondary", []) if s in symptom_to_idx]
        rare      = [s for s in info.get("rare", [])      if s in symptom_to_idx]
        all_syms  = primary + secondary + rare

        if len(all_syms) < 2:
            continue

        noise_pool = [s for s in SYMPTOMS if s not in all_syms]

        for _ in range(samples_per_disease):
            row = [0] * n_symptoms

            # Always include most primary symptoms
            n_primary = max(1, int(len(primary) * np.random.uniform(0.6, 1.0)))
            chosen_primary = random.sample(primary, min(n_primary, len(primary)))

            # Add some secondary symptoms
            n_secondary = int(len(secondary) * np.random.uniform(0.0, 0.7))
            chosen_secondary = random.sample(secondary, min(n_secondary, len(secondary)))

            # Occasionally add rare symptoms
            chosen_rare = []
            if rare and random.random() < 0.15:
                chosen_rare = random.sample(rare, min(1, len(rare)))

            for s in chosen_primary + chosen_secondary + chosen_rare:
                row[symptom_to_idx[s]] = 1

            # Add 0-3 noise symptoms
            n_noise = np.random.randint(0, 4)
            if noise_pool and n_noise > 0:
                for s in random.sample(noise_pool, min(n_noise, len(noise_pool))):
                    row[symptom_to_idx[s]] = 1

            # Extra features
            symptom_count = sum(row)
            age_group = random.choice([0, 1, 2])  # 0=child, 1=adult, 2=elderly
            duration = random.randint(1, 14)

            age_child   = 1 if age_group == 0 else 0
            age_adult   = 1 if age_group == 1 else 0
            age_elderly = 1 if age_group == 2 else 0

            full_row = row + [symptom_count, age_child, age_adult, age_elderly, duration]
            X.append(full_row)
            y.append(disease)

    return np.array(X), np.array(y)

import pandas as pd

if __name__ == "__main__":
    print(f"Total diseases: {len(DISEASE_DB)}")
    print(f"Total symptoms: {len(SYMPTOMS)}")

    X, y = generate_dataset()

    print(f"Dataset shape: {X.shape}")
    print(f"Unique diseases: {len(set(y))}")
    print("Sample diseases:", list(set(y))[:5])

    # Create column names
    extra_cols = ["symptom_count", "age_child", "age_adult", "age_elderly", "duration"]
    columns = SYMPTOMS + extra_cols

    # Convert to DataFrame
    df = pd.DataFrame(X, columns=columns)
    df["disease"] = y

    # Save dataset
    df.to_csv("medical_symptom_dataset.csv", index=False)

    print("Dataset saved as medical_symptom_dataset.csv")
