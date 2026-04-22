"""Reproducible dataset builder for the symptom-disease model.

What this script does (Phase 2):
    1. Loads the existing 1,500-row binary-symptom CSV
       (`disease_dataset_1500_rows.csv`).
    2. Adds 25 new contextual feature columns matching the `contextualAnswers`
       keys collected by the Phase 1 adaptive-questioning feature:
          fever_temp_f, fever_duration_days, fever_chills,
          cough_type, cough_duration_days, cough_blood,
          headache_severity, headache_sudden,
          fatigue_duration,
          vomiting_frequency_per_day, vomiting_blood,
          recent_food_street, recent_food_seafood, recent_food_leftovers,
          chest_pain_character, chest_pain_radiates,
          breathlessness_severity,
          nausea_duration,
          dizziness_fainting,
          diarrhea_frequency, diarrhea_blood, diarrhea_dehydration,
          weight_loss_amount,
          sweating_night,
          general_duration, general_travel
    3. Augments the dataset with ~6x synthetic rows per class, drawn from
       disease-specific distributions grounded in common clinical patterns.
       Target: ~8,000 balanced rows.
    4. Writes `data/merged_dataset.csv`.

The distributions below are NOT clinical-grade — they encode plausible
ranges (fever temperature, duration, typical exposures, etc.) so the
model can learn to separate diseases that share the same binary-symptom
profile (e.g. Dengue vs Flu vs COVID-19 all have fever + body pain).

Run:
    cd "ML Services/Symtums_diseas"
    python build_dataset.py
"""

from __future__ import annotations

import json
import random
from pathlib import Path

import numpy as np
import pandas as pd

RANDOM_SEED = 42
TARGET_ROWS_PER_DISEASE = 550  # × 14 diseases ≈ 7,700 rows

BASE_DIR = Path(__file__).resolve().parent
INPUT_CSV = BASE_DIR / "disease_dataset_1500_rows.csv"
DATA_DIR = BASE_DIR / "data"
OUTPUT_CSV = DATA_DIR / "merged_dataset.csv"
METADATA_JSON = DATA_DIR / "dataset_metadata.json"

BINARY_SYMPTOM_COLS = [
    "fever", "cough", "headache", "fatigue", "vomiting", "chest_pain",
    "sore_throat", "breathlessness", "nausea", "dizziness", "body_pain",
    "diarrhea", "skin_rash", "itching", "weight_loss", "sweating",
]

# ── Categorical vocabularies (must match the frontend adaptive-questions
#    catalog in Backend/data/symptomFollowUps.js so client-sent values
#    can be one-hot encoded at inference without surprises)
FEVER_DURATION = ["<1", "1-3", "4-7", ">7", "unknown"]
COUGH_TYPE = ["Dry", "With mucus", "Mix of both", "unknown"]
COUGH_DURATION = ["<3 days", "3-7 days", "1-3 weeks", ">3 weeks", "unknown"]
HEADACHE_SEVERITY = ["Mild", "Moderate", "Severe", "Worst ever", "unknown"]
FATIGUE_DURATION = ["<3 days", "3-7 days", "1-4 weeks", ">1 month", "unknown"]
CHEST_PAIN_CHARACTER = [
    "Pressure / squeezing", "Sharp / stabbing", "Burning", "Aching", "unknown",
]
BREATHLESSNESS_SEVERITY = [
    "Mild", "Moderate", "Severe", "Cannot speak full sentences", "unknown",
]
NAUSEA_DURATION = ["<12h", "12-48h", "2-7d", ">1 week", "unknown"]
WEIGHT_LOSS_AMOUNT = ["<2 kg", "2-5 kg", "5-10 kg", ">10 kg", "unknown"]
GENERAL_DURATION = ["<24h", "1-3d", "4-7d", ">1wk", "unknown"]
GENERAL_TRAVEL = ["No", "Domestic", "International", "unknown"]

# ── Disease-specific contextual distributions.
# Each entry is a callable that, given an rng, returns a dict of contextual
# feature values. Features not relevant for a disease get randomised across
# the full vocabulary (background noise) so the model doesn't learn
# spurious perfect-correlation signals.
def _rand_cat(rng: random.Random, values: list[str]) -> str:
    return rng.choice(values)


def _weighted_cat(rng: random.Random, values: list[str], weights: list[float]) -> str:
    return rng.choices(values, weights=weights, k=1)[0]


def _noise_defaults(rng: random.Random) -> dict:
    """Background random values for every contextual feature. Disease-specific
    samplers overwrite the relevant keys."""
    return {
        "fever_temp_f": round(rng.gauss(98.6, 0.6), 1),
        "fever_duration_days": _rand_cat(rng, FEVER_DURATION),
        "fever_chills": rng.choice(["Yes", "No", "unknown"]),
        "cough_type": _rand_cat(rng, COUGH_TYPE),
        "cough_duration_days": _rand_cat(rng, COUGH_DURATION),
        "cough_blood": _weighted_cat(rng, ["Yes", "No", "unknown"], [0.02, 0.9, 0.08]),
        "headache_severity": _rand_cat(rng, HEADACHE_SEVERITY),
        "headache_sudden": _weighted_cat(rng, ["Yes", "No", "unknown"], [0.05, 0.85, 0.10]),
        "fatigue_duration": _rand_cat(rng, FATIGUE_DURATION),
        "vomiting_frequency_per_day": 0,
        "vomiting_blood": _weighted_cat(rng, ["Yes", "No", "unknown"], [0.02, 0.9, 0.08]),
        "recent_food_street": int(rng.random() < 0.1),
        "recent_food_seafood": int(rng.random() < 0.08),
        "recent_food_leftovers": int(rng.random() < 0.1),
        "chest_pain_character": _rand_cat(rng, CHEST_PAIN_CHARACTER),
        "chest_pain_radiates": _weighted_cat(rng, ["Yes", "No", "unknown"], [0.05, 0.85, 0.10]),
        "breathlessness_severity": _rand_cat(rng, BREATHLESSNESS_SEVERITY),
        "nausea_duration": _rand_cat(rng, NAUSEA_DURATION),
        "dizziness_fainting": _weighted_cat(rng, ["Yes", "No", "unknown"], [0.03, 0.87, 0.10]),
        "diarrhea_frequency": 0,
        "diarrhea_blood": _weighted_cat(rng, ["Yes", "No", "unknown"], [0.02, 0.9, 0.08]),
        "diarrhea_dehydration": _weighted_cat(rng, ["Yes", "No", "unknown"], [0.05, 0.85, 0.10]),
        "weight_loss_amount": _rand_cat(rng, WEIGHT_LOSS_AMOUNT),
        "sweating_night": _weighted_cat(rng, ["Yes", "No", "unknown"], [0.1, 0.8, 0.1]),
        "general_duration": _rand_cat(rng, GENERAL_DURATION),
        "general_travel": _rand_cat(rng, GENERAL_TRAVEL),
    }


def _dengue_sampler(rng: random.Random, base_row: dict) -> dict:
    ctx = _noise_defaults(rng)
    if base_row.get("fever", 0) == 1:
        ctx["fever_temp_f"] = round(rng.gauss(103.0, 1.3), 1)
        ctx["fever_duration_days"] = _weighted_cat(rng, ["1-3", "4-7", ">7"], [0.3, 0.55, 0.15])
        ctx["fever_chills"] = _weighted_cat(rng, ["Yes", "No"], [0.7, 0.3])
    ctx["headache_severity"] = _weighted_cat(rng, ["Moderate", "Severe"], [0.55, 0.45])
    ctx["sweating_night"] = _weighted_cat(rng, ["Yes", "No"], [0.3, 0.7])
    ctx["general_duration"] = _weighted_cat(rng, ["1-3d", "4-7d"], [0.45, 0.55])
    ctx["general_travel"] = _weighted_cat(rng, ["No", "Domestic", "International"], [0.3, 0.5, 0.2])
    return ctx


def _malaria_sampler(rng: random.Random, base_row: dict) -> dict:
    ctx = _noise_defaults(rng)
    if base_row.get("fever", 0) == 1:
        ctx["fever_temp_f"] = round(rng.gauss(102.0, 1.5), 1)
        ctx["fever_duration_days"] = _weighted_cat(rng, ["1-3", "4-7", ">7"], [0.35, 0.45, 0.2])
        ctx["fever_chills"] = _weighted_cat(rng, ["Yes", "No"], [0.85, 0.15])
    ctx["sweating_night"] = _weighted_cat(rng, ["Yes", "No"], [0.6, 0.4])
    ctx["general_travel"] = _weighted_cat(rng, ["No", "Domestic", "International"], [0.2, 0.55, 0.25])
    ctx["general_duration"] = _weighted_cat(rng, ["1-3d", "4-7d", ">1wk"], [0.35, 0.45, 0.2])
    return ctx


def _typhoid_sampler(rng: random.Random, base_row: dict) -> dict:
    ctx = _noise_defaults(rng)
    if base_row.get("fever", 0) == 1:
        ctx["fever_temp_f"] = round(rng.gauss(102.5, 1.3), 1)
        ctx["fever_duration_days"] = _weighted_cat(rng, ["4-7", ">7"], [0.55, 0.45])
    ctx["general_travel"] = _weighted_cat(rng, ["No", "Domestic", "International"], [0.35, 0.4, 0.25])
    ctx["recent_food_street"] = int(rng.random() < 0.55)
    ctx["recent_food_leftovers"] = int(rng.random() < 0.3)
    ctx["general_duration"] = _weighted_cat(rng, ["4-7d", ">1wk"], [0.55, 0.45])
    return ctx


def _food_poisoning_sampler(rng: random.Random, base_row: dict) -> dict:
    ctx = _noise_defaults(rng)
    ctx["vomiting_frequency_per_day"] = int(rng.choices(range(0, 12), weights=[1, 2, 3, 4, 5, 4, 3, 2, 2, 1, 1, 1])[0])
    if base_row.get("diarrhea", 0) == 1:
        ctx["diarrhea_frequency"] = int(rng.choices(range(0, 12), weights=[1, 2, 3, 4, 4, 3, 2, 2, 1, 1, 1, 1])[0])
        ctx["diarrhea_dehydration"] = _weighted_cat(rng, ["Yes", "No"], [0.45, 0.55])
    ctx["recent_food_street"] = int(rng.random() < 0.7)
    ctx["recent_food_seafood"] = int(rng.random() < 0.35)
    ctx["recent_food_leftovers"] = int(rng.random() < 0.55)
    ctx["nausea_duration"] = _weighted_cat(rng, ["<12h", "12-48h", "2-7d"], [0.45, 0.4, 0.15])
    ctx["general_duration"] = _weighted_cat(rng, ["<24h", "1-3d"], [0.55, 0.45])
    return ctx


def _flu_sampler(rng: random.Random, base_row: dict) -> dict:
    ctx = _noise_defaults(rng)
    if base_row.get("fever", 0) == 1:
        ctx["fever_temp_f"] = round(rng.gauss(101.2, 1.2), 1)
        ctx["fever_duration_days"] = _weighted_cat(rng, ["1-3", "4-7"], [0.55, 0.45])
        ctx["fever_chills"] = _weighted_cat(rng, ["Yes", "No"], [0.6, 0.4])
    if base_row.get("cough", 0) == 1:
        ctx["cough_type"] = _weighted_cat(rng, ["Dry", "With mucus", "Mix of both"], [0.55, 0.2, 0.25])
        ctx["cough_duration_days"] = _weighted_cat(rng, ["<3 days", "3-7 days"], [0.55, 0.45])
    ctx["general_duration"] = _weighted_cat(rng, ["1-3d", "4-7d"], [0.55, 0.45])
    return ctx


def _cold_sampler(rng: random.Random, base_row: dict) -> dict:
    ctx = _noise_defaults(rng)
    if base_row.get("fever", 0) == 1:
        ctx["fever_temp_f"] = round(rng.gauss(99.5, 0.8), 1)
        ctx["fever_duration_days"] = _weighted_cat(rng, ["<1", "1-3"], [0.55, 0.45])
    if base_row.get("cough", 0) == 1:
        ctx["cough_type"] = _weighted_cat(rng, ["Dry", "With mucus"], [0.55, 0.45])
        ctx["cough_duration_days"] = _weighted_cat(rng, ["<3 days", "3-7 days"], [0.6, 0.4])
    ctx["general_duration"] = _weighted_cat(rng, ["1-3d", "4-7d"], [0.6, 0.4])
    return ctx


def _covid_sampler(rng: random.Random, base_row: dict) -> dict:
    ctx = _noise_defaults(rng)
    if base_row.get("fever", 0) == 1:
        ctx["fever_temp_f"] = round(rng.gauss(100.8, 1.4), 1)
        ctx["fever_duration_days"] = _weighted_cat(rng, ["1-3", "4-7"], [0.5, 0.5])
    if base_row.get("cough", 0) == 1:
        ctx["cough_type"] = _weighted_cat(rng, ["Dry", "With mucus", "Mix of both"], [0.65, 0.2, 0.15])
        ctx["cough_duration_days"] = _weighted_cat(rng, ["<3 days", "3-7 days", "1-3 weeks"], [0.35, 0.45, 0.2])
    if base_row.get("breathlessness", 0) == 1:
        ctx["breathlessness_severity"] = _weighted_cat(rng, ["Mild", "Moderate", "Severe"], [0.45, 0.4, 0.15])
    ctx["general_duration"] = _weighted_cat(rng, ["1-3d", "4-7d", ">1wk"], [0.3, 0.45, 0.25])
    return ctx


def _measles_sampler(rng: random.Random, base_row: dict) -> dict:
    ctx = _noise_defaults(rng)
    if base_row.get("fever", 0) == 1:
        ctx["fever_temp_f"] = round(rng.gauss(102.0, 1.2), 1)
        ctx["fever_duration_days"] = _weighted_cat(rng, ["1-3", "4-7"], [0.5, 0.5])
    ctx["general_duration"] = _weighted_cat(rng, ["1-3d", "4-7d"], [0.5, 0.5])
    return ctx


def _chickenpox_sampler(rng: random.Random, base_row: dict) -> dict:
    ctx = _noise_defaults(rng)
    if base_row.get("fever", 0) == 1:
        ctx["fever_temp_f"] = round(rng.gauss(100.8, 1.2), 1)
    ctx["general_duration"] = _weighted_cat(rng, ["1-3d", "4-7d"], [0.5, 0.5])
    return ctx


def _jaundice_sampler(rng: random.Random, base_row: dict) -> dict:
    ctx = _noise_defaults(rng)
    ctx["fatigue_duration"] = _weighted_cat(rng, ["3-7 days", "1-4 weeks", ">1 month"], [0.35, 0.45, 0.2])
    ctx["nausea_duration"] = _weighted_cat(rng, ["2-7d", ">1 week"], [0.55, 0.45])
    ctx["general_duration"] = _weighted_cat(rng, ["4-7d", ">1wk"], [0.45, 0.55])
    return ctx


def _diabetes_sampler(rng: random.Random, base_row: dict) -> dict:
    ctx = _noise_defaults(rng)
    ctx["fatigue_duration"] = _weighted_cat(rng, ["1-4 weeks", ">1 month"], [0.4, 0.6])
    ctx["weight_loss_amount"] = _weighted_cat(rng, ["<2 kg", "2-5 kg", "5-10 kg"], [0.35, 0.4, 0.25])
    ctx["general_duration"] = _weighted_cat(rng, [">1wk"], [1.0])
    return ctx


def _migraine_sampler(rng: random.Random, base_row: dict) -> dict:
    ctx = _noise_defaults(rng)
    ctx["headache_severity"] = _weighted_cat(rng, ["Moderate", "Severe", "Worst ever"], [0.35, 0.55, 0.1])
    ctx["headache_sudden"] = _weighted_cat(rng, ["Yes", "No"], [0.1, 0.9])
    if base_row.get("nausea", 0) == 1:
        ctx["nausea_duration"] = _weighted_cat(rng, ["<12h", "12-48h"], [0.6, 0.4])
    ctx["general_duration"] = _weighted_cat(rng, ["<24h", "1-3d"], [0.5, 0.5])
    return ctx


def _asthma_sampler(rng: random.Random, base_row: dict) -> dict:
    ctx = _noise_defaults(rng)
    if base_row.get("breathlessness", 0) == 1:
        ctx["breathlessness_severity"] = _weighted_cat(
            rng,
            ["Mild", "Moderate", "Severe", "Cannot speak full sentences"],
            [0.4, 0.35, 0.2, 0.05],
        )
    if base_row.get("cough", 0) == 1:
        ctx["cough_type"] = _weighted_cat(rng, ["Dry", "With mucus"], [0.65, 0.35])
    ctx["general_duration"] = _weighted_cat(rng, ["1-3d", "4-7d", ">1wk"], [0.3, 0.35, 0.35])
    return ctx


def _arthritis_sampler(rng: random.Random, base_row: dict) -> dict:
    ctx = _noise_defaults(rng)
    ctx["fatigue_duration"] = _weighted_cat(rng, ["1-4 weeks", ">1 month"], [0.45, 0.55])
    ctx["general_duration"] = _weighted_cat(rng, [">1wk"], [1.0])
    return ctx


DISEASE_SAMPLERS = {
    "Dengue": _dengue_sampler,
    "Malaria": _malaria_sampler,
    "Typhoid": _typhoid_sampler,
    "Food Poisoning": _food_poisoning_sampler,
    "Flu": _flu_sampler,
    "Cold": _cold_sampler,
    "COVID-19": _covid_sampler,
    "Measles": _measles_sampler,
    "Chickenpox": _chickenpox_sampler,
    "Jaundice": _jaundice_sampler,
    "Diabetes": _diabetes_sampler,
    "Migraine": _migraine_sampler,
    "Asthma": _asthma_sampler,
    "Arthritis": _arthritis_sampler,
}

CONTEXT_COLUMNS = list(_noise_defaults(random.Random(0)).keys())


def _augment_binary_symptoms(rng: random.Random, row: dict) -> dict:
    """Lightly perturb binary symptoms so augmented rows aren't identical.
    Flips ~5% of zeros to ones and ~5% of ones to zeros per row, keeping
    the core pattern intact. Also enforces a minimum of 2 symptoms.
    """
    out = {k: row[k] for k in BINARY_SYMPTOM_COLS}
    # Prob of flipping each bit — small perturbation
    for k in BINARY_SYMPTOM_COLS:
        if rng.random() < 0.05:
            out[k] = 1 - out[k]
    # Enforce at least 2 symptoms — if below, turn on the original ones first
    if sum(out.values()) < 2:
        originals = [k for k in BINARY_SYMPTOM_COLS if row[k] == 1]
        for k in originals:
            out[k] = 1
            if sum(out.values()) >= 2:
                break
    return out


def build_dataset() -> pd.DataFrame:
    rng = random.Random(RANDOM_SEED)
    np.random.seed(RANDOM_SEED)

    if not INPUT_CSV.exists():
        raise FileNotFoundError(f"Input CSV not found: {INPUT_CSV}")

    df = pd.read_csv(INPUT_CSV)
    df.columns = [c.strip() for c in df.columns]

    # Ensure binary cols are numeric 0/1
    for col in BINARY_SYMPTOM_COLS:
        if col not in df.columns:
            raise ValueError(f"Expected column missing from input: {col}")
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)
    df["disease"] = df["disease"].astype(str).str.strip()
    df = df[df["disease"].isin(DISEASE_SAMPLERS.keys())].reset_index(drop=True)

    # First: enrich every existing row with contextual features from that
    # disease's sampler. This keeps the real-world rows as clinical anchors.
    enriched_rows: list[dict] = []
    for _, row in df.iterrows():
        base = {c: int(row[c]) for c in BINARY_SYMPTOM_COLS}
        base["disease"] = row["disease"]
        ctx = DISEASE_SAMPLERS[row["disease"]](rng, base)
        enriched_rows.append({**base, **ctx})

    enriched_df = pd.DataFrame(enriched_rows)

    # Second: synthetic augmentation per class to reach TARGET_ROWS_PER_DISEASE
    augmented_rows: list[dict] = []
    for disease, sampler in DISEASE_SAMPLERS.items():
        existing_count = (enriched_df["disease"] == disease).sum()
        needed = max(0, TARGET_ROWS_PER_DISEASE - int(existing_count))
        if needed == 0:
            continue
        # Draw from this disease's existing rows as seed patterns
        seeds = enriched_df[enriched_df["disease"] == disease]
        if seeds.empty:
            continue
        for _ in range(needed):
            seed = seeds.sample(1, random_state=rng.randint(0, 10**9)).iloc[0].to_dict()
            new_binaries = _augment_binary_symptoms(rng, seed)
            base = {**new_binaries, "disease": disease}
            ctx = sampler(rng, base)
            augmented_rows.append({**base, **ctx})

    augmented_df = pd.DataFrame(augmented_rows)
    merged = pd.concat([enriched_df, augmented_df], ignore_index=True)

    # Shuffle so train/test split doesn't see clean blocks per class
    merged = merged.sample(frac=1.0, random_state=RANDOM_SEED).reset_index(drop=True)
    return merged


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    merged = build_dataset()
    merged.to_csv(OUTPUT_CSV, index=False)

    counts = merged["disease"].value_counts().to_dict()
    metadata = {
        "seed": RANDOM_SEED,
        "target_rows_per_disease": TARGET_ROWS_PER_DISEASE,
        "total_rows": int(len(merged)),
        "classes": len(counts),
        "class_counts": counts,
        "binary_features": BINARY_SYMPTOM_COLS,
        "context_features": CONTEXT_COLUMNS,
    }
    METADATA_JSON.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print(f"Wrote {OUTPUT_CSV} — {len(merged)} rows, {len(counts)} classes")
    for disease, count in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"  {disease:<20} {count}")


if __name__ == "__main__":
    main()
