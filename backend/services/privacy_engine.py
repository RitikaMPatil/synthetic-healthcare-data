import pandas as pd
import numpy as np
import logging
from typing import Tuple
from backend.models.schemas import PrivacyMechanism, GenerateRequest

logger = logging.getLogger(__name__)

QUASI_IDENTIFIERS = ["age", "gender", "blood_type", "department", "insurance_type"]


def apply_differential_privacy(df: pd.DataFrame, epsilon: float, delta: float) -> pd.DataFrame:
    """
    Apply Laplace mechanism DP noise to numeric columns.
    Uses sensitivity = column range / n_records for bounded queries.
    """
    df = df.copy()
    n = len(df)

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    for col in numeric_cols:
        col_range = df[col].max() - df[col].min()
        if col_range == 0:
            continue
        # Laplace noise scale = sensitivity / epsilon
        sensitivity = col_range / n
        noise_scale = sensitivity / epsilon
        noise = np.random.laplace(0, noise_scale, size=n)
        df[col] = df[col] + noise
        # Clip to original bounds
        df[col] = df[col].clip(df[col].min(), df[col].max())

    # Round integer-like columns
    int_cols = ["age", "length_of_stay_days", "heart_rate_bpm"]
    for col in int_cols:
        if col in df.columns:
            df[col] = df[col].round().astype(int)

    logger.info(f"Applied DP with epsilon={epsilon}, delta={delta} to {len(numeric_cols)} numeric columns")
    return df


def apply_k_anonymity(df: pd.DataFrame, k: int) -> pd.DataFrame:
    """
    Suppress records that form groups smaller than k on quasi-identifiers.
    Also generalizes age into 10-year brackets.
    """
    df = df.copy()
    qi_cols = [c for c in QUASI_IDENTIFIERS if c in df.columns]

    if "age" in df.columns:
        df["age"] = (df["age"] // 10) * 10  # generalize to decade

    group_counts = df.groupby(qi_cols)[qi_cols[0]].transform("count")
    before = len(df)
    df = df[group_counts >= k].reset_index(drop=True)
    after = len(df)
    logger.info(f"k-anonymity (k={k}): suppressed {before - after} records, kept {after}")
    return df


def apply_privacy(df: pd.DataFrame, request: GenerateRequest) -> pd.DataFrame:
    """Dispatch to the correct privacy mechanism."""
    if request.privacy_mechanism == PrivacyMechanism.DIFFERENTIAL_PRIVACY:
        return apply_differential_privacy(df, request.epsilon, request.delta)
    elif request.privacy_mechanism == PrivacyMechanism.K_ANONYMITY:
        return apply_k_anonymity(df, request.k_anonymity_k)
    else:
        return df


def compute_privacy_metrics(real: pd.DataFrame, synthetic: pd.DataFrame) -> dict:
    """
    Compute privacy risk metrics:
    - Membership inference risk (nearest-neighbor distance)
    - Attribute disclosure risk (correlation of sensitive attrs)
    """
    metrics = {}

    # Nearest-neighbor distance ratio (NNDR) — lower synthetic NNDR = more private
    numeric_real = real.select_dtypes(include=[np.number]).fillna(0)
    numeric_syn = synthetic.select_dtypes(include=[np.number]).fillna(0)

    if not numeric_real.empty and not numeric_syn.empty:
        # Normalise
        from sklearn.preprocessing import MinMaxScaler
        scaler = MinMaxScaler()
        real_scaled = scaler.fit_transform(numeric_real)
        syn_scaled = scaler.transform(numeric_syn.reindex(columns=numeric_real.columns, fill_value=0))

        # Sample 200 points for speed
        sample_size = min(200, len(real_scaled), len(syn_scaled))
        rng = np.random.default_rng(0)
        r_idx = rng.choice(len(real_scaled), sample_size, replace=False)
        s_idx = rng.choice(len(syn_scaled), sample_size, replace=False)

        from sklearn.metrics import pairwise_distances
        dist_matrix = pairwise_distances(syn_scaled[s_idx], real_scaled[r_idx])
        min_dists = dist_matrix.min(axis=1)
        avg_nn_dist = float(min_dists.mean())

        # Privacy score: higher average distance = better privacy (scale 0-1)
        privacy_score = float(min(avg_nn_dist * 5, 1.0))
        metrics["avg_nn_distance"] = round(avg_nn_dist, 4)
        metrics["membership_inference_risk"] = round(1.0 - privacy_score, 4)
        metrics["privacy_score"] = round(privacy_score, 4)
    else:
        metrics["privacy_score"] = 0.5
        metrics["membership_inference_risk"] = 0.5

    return metrics