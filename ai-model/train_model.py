import numpy as np
import pickle
import gzip
import os
import json
from dataset_generator import generate_dataset, SYMPTOMS, DISEASE_DB

def train():
    print("=" * 60)
    print("  AIMedScan Model Training (Best of Both Worlds)")
    print("=" * 60)

    print(f"\n📊 Disease count : {len(DISEASE_DB)}")
    print(f"📊 Symptom count : {len(SYMPTOMS)}")

    # ─── Generate Dataset ──────────────────────────────────────
    print("\n🔄 Generating training dataset (700 samples/disease)...")
    X, y = generate_dataset(samples_per_disease=700)
    print(f"✅ Dataset size  : {X.shape[0]} samples × {X.shape[1]} features")
    print(f"✅ Disease labels: {len(set(y))} unique classes")

    # ─── Train/Test Split ──────────────────────────────────────
    from sklearn.model_selection import train_test_split
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import LabelEncoder, StandardScaler
    from sklearn.metrics import accuracy_score, classification_report

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"\n🔀 Train size: {len(X_train)} | Test size: {len(X_test)}")

    # ─── Encode Labels ─────────────────────────────────────────
    le = LabelEncoder()
    y_train_enc = le.fit_transform(y_train)
    y_test_enc  = le.transform(y_test)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    # ─── Train Model ───────────────────────────────────────────
    # KEY INSIGHT: the 669 MB size comes from max_depth=None (unlimited depth)
    # Each tree with 58k samples and no depth cap = thousands of nodes per tree
    # Setting max_depth=15 keeps accuracy near-identical but each tree is tiny
    print("\n🤖 Training RandomForest (n_estimators=600, max_depth=15)...")
    clf = RandomForestClassifier(
        n_estimators=600,       # same as original — keeps accuracy high
        max_depth=15,           # THIS is the fix — was None (unlimited)
        min_samples_split=2,
        min_samples_leaf=1,     # same as original
        max_features="sqrt",
        random_state=42,
        n_jobs=-1,
        class_weight="balanced_subsample",
    )
    clf.fit(X_train_scaled, y_train_enc)
    print("✅ Training complete!")

    # ─── Evaluate ──────────────────────────────────────────────
    y_pred = clf.predict(X_test_scaled)
    acc = accuracy_score(y_test_enc, y_pred)
    print(f"\n📈 Test Accuracy: {acc * 100:.2f}%")
    print("\n📋 Classification Report (first 20 classes):")
    report = classification_report(
        y_test_enc, y_pred,
        target_names=le.classes_,
        zero_division=0
    )
    lines = report.split('\n')
    print('\n'.join(lines[:40]))

    # ─── Save Models ───────────────────────────────────────────
    os.makedirs("models", exist_ok=True)

    bundle = {
        "model":         clf,
        "scaler":        scaler,
        "label_encoder": le,
        "feature_names": SYMPTOMS + ["symptom_count", "age_child", "age_adult", "age_elderly", "duration"],
        "classes":       list(le.classes_),
        "accuracy":      acc,
    }

    # Save compressed .gz (primary — use this for deployment)
    gz_path = "models/model.gz"
    with gzip.open(gz_path, "wb", compresslevel=9) as f:
        pickle.dump(bundle, f)

    # Save individual files (backward compatibility)
    with open("models/model.pkl", "wb") as f:
        pickle.dump(clf, f)
    with open("models/scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)
    with open("models/symptom_encoder.pkl", "wb") as f:
        pickle.dump(SYMPTOMS, f)
    with open("models/disease_encoder.pkl", "wb") as f:
        pickle.dump(le, f)

    feature_names = SYMPTOMS + ["symptom_count", "age_child", "age_adult", "age_elderly", "duration"]
    with open("models/feature_names.json", "w") as f:
        json.dump(feature_names, f, indent=2)

    disease_meta = {
        name: {
            "severity":        info.get("severity", "mild"),
            "precautions":     info.get("precautions", []),
            "explanation":     info.get("explanation", ""),
            "recommendations": info.get("recommendations", []),
        }
        for name, info in DISEASE_DB.items()
    }
    with open("models/disease_metadata.json", "w") as f:
        json.dump(disease_meta, f, indent=2)

    # ─── Final report ──────────────────────────────────────────
    gz_mb  = os.path.getsize("models/model.gz")  / 1e6
    pkl_mb = os.path.getsize("models/model.pkl") / 1e6

    print("\n✅ Saved files:")
    print(f"   models/model.gz         {gz_mb:.1f} MB  ← deploy this")
    print(f"   models/model.pkl        {pkl_mb:.1f} MB")
    print(f"   models/scaler.pkl")
    print(f"   models/symptom_encoder.pkl")
    print(f"   models/disease_encoder.pkl")
    print(f"   models/feature_names.json")
    print(f"   models/disease_metadata.json")
    print(f"\n🎉 Done!")
    print(f"   Diseases  : {len(DISEASE_DB)}")
    print(f"   Symptoms  : {len(SYMPTOMS)}")
    print(f"   Accuracy  : {acc*100:.2f}%")
    print(f"   Size (gz) : {gz_mb:.1f} MB  (was 669 MB)")

if __name__ == "__main__":
    train()
