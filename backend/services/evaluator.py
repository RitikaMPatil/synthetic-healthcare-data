import pandas as pd
import numpy as np
import logging
from typing import Dict, Any
from scipy import stats
from sklearn.preprocessing import LabelEncoder
from backend.models.schemas import EvaluationResult

logger = logging.getLogger(__name__)


def compute_statistical_similarity(real: pd.DataFrame, synthetic: pd.DataFrame) -> Dict[str, Any]:
    """KS test + mean/std comparison for numeric columns, TVD for categoricals."""
    results = {}
    ks_scores = []

    numeric_cols = real.select_dtypes(include=[np.number]).columns

    for col in numeric_cols:
        if col not in synthetic.columns:
            continue
        r_vals = real[col].dropna()
        s_vals = synthetic[col].dropna()
        if len(r_vals) < 5 or len(s_vals) < 5:
            continue
        ks_stat, p_val = stats.ks_2samp(r_vals, s_vals)
        results[col] = {
            "type": "numeric",
            "ks_statistic": round(float(ks_stat), 4),
            "ks_pvalue": round(float(p_val), 4),
            "real_mean": round(float(r_vals.mean()), 4),
            "syn_mean": round(float(s_vals.mean()), 4),
            "real_std": round(float(r_vals.std()), 4),
            "syn_std": round(float(s_vals.std()), 4),
        }
        ks_scores.append(1 - ks_stat)  # higher = more similar

    cat_cols = real.select_dtypes(include=["object", "bool", "category"]).columns

    tvd_scores = []
    for col in cat_cols:
        if col not in synthetic.columns:
            continue
        r_freq = real[col].value_counts(normalize=True)
        s_freq = synthetic[col].value_counts(normalize=True)
        all_cats = set(r_freq.index) | set(s_freq.index)
        tvd = sum(abs(r_freq.get(c, 0) - s_freq.get(c, 0)) for c in all_cats) / 2
        results[col] = {
            "type": "categorical",
            "total_variation_distance": round(float(tvd), 4),
        }
        tvd_scores.append(1 - tvd)

    all_scores = ks_scores + tvd_scores
    overall_similarity = float(np.mean(all_scores)) if all_scores else 0.5

    return {"overall": round(overall_similarity, 4), "columns": results}


def compute_column_correlations(real: pd.DataFrame, synthetic: pd.DataFrame) -> Dict[str, Any]:
    """Compare Pearson correlation matrices between real and synthetic numeric data."""
    numeric_cols = list(real.select_dtypes(include=[np.number]).columns)
    if len(numeric_cols) < 2:
        return {"error": "Not enough numeric columns"}

    real_corr = real[numeric_cols].corr().round(3).to_dict()
    syn_corr = synthetic[numeric_cols].corr().round(3).to_dict()

    # Flatten and compute RMSE between matrices
    real_vals = real[numeric_cols].corr().values
    syn_vals = synthetic[numeric_cols].corr().values
    rmse = float(np.sqrt(np.nanmean((real_vals - syn_vals) ** 2)))

    return {
        "real_correlations": real_corr,
        "synthetic_correlations": syn_corr,
        "correlation_rmse": round(rmse, 4),
        "columns": numeric_cols,
    }


def compute_utility_score(real: pd.DataFrame, synthetic: pd.DataFrame) -> float:
    """
    Train-on-synthetic, test-on-real (TSTR) utility score.
    Uses a simple RandomForest to predict a binary target.
    """
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import roc_auc_score
    from sklearn.preprocessing import LabelEncoder

    target_col = "readmitted_30_days" if "readmitted_30_days" in real.columns else None
    if target_col is None:
        return 0.5

    def encode_df(df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        for col in df.select_dtypes(include=["object"]).columns:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
        df[target_col] = df[target_col].astype(int)
        return df.fillna(0)

    try:
        real_enc = encode_df(real)
        syn_enc = encode_df(synthetic)

        feature_cols = [c for c in real_enc.columns if c != target_col]

        X_syn = syn_enc[feature_cols]
        y_syn = syn_enc[target_col]
        X_real = real_enc[feature_cols]
        y_real = real_enc[target_col]

        clf = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1)
        clf.fit(X_syn, y_syn)

        if len(np.unique(y_real)) < 2:
            return 0.5

        probs = clf.predict_proba(X_real)[:, 1]
        auc = roc_auc_score(y_real, probs)
        return round(float(auc), 4)
    except Exception as e:
        logger.warning(f"Utility score computation failed: {e}")
        return 0.5


def evaluate(real: pd.DataFrame, synthetic: pd.DataFrame, privacy_metrics: dict) -> EvaluationResult:
    """Run full evaluation pipeline."""
    stat_sim = compute_statistical_similarity(real, synthetic)
    col_corr = compute_column_correlations(real, synthetic)
    utility = compute_utility_score(real, synthetic)

    return EvaluationResult(
        statistical_similarity=stat_sim["overall"],
        privacy_score=privacy_metrics.get("privacy_score", 0.5),
        utility_score=utility,
        column_correlations=col_corr,
        distribution_metrics=stat_sim["columns"],
        privacy_metrics=privacy_metrics,
    )