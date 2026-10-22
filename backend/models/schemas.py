from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum


class GeneratorType(str, Enum):
    CTGAN = "ctgan"
    GAUSSIAN_COPULA = "gaussian_copula"
    TVAE = "tvae"


class PrivacyMechanism(str, Enum):
    NONE = "none"
    DIFFERENTIAL_PRIVACY = "differential_privacy"
    K_ANONYMITY = "k_anonymity"


class GenerateResponse(BaseModel):
    success: bool
    message: str
    rows_generated: int
    columns: List[str]
    preview: List[Dict[str, Any]]
    evaluation: Optional[EvaluationResult] = None
    generation_time_seconds: float
    csv_data: str


class EvaluationResult(BaseModel):
    statistical_similarity: float
    privacy_score: float
    utility_score: float
    column_correlations: Dict[str, Any]
    distribution_metrics: Dict[str, Any]
    privacy_metrics: Dict[str, Any]


class GenerateResponse(BaseModel):
    success: bool
    message: str
    rows_generated: int
    columns: List[str]
    preview: List[Dict[str, Any]]
    evaluation: Optional[EvaluationResult] = None
    generation_time_seconds: float


class ColumnStats(BaseModel):
    name: str
    dtype: str
    missing_pct: float
    unique_count: int
    sample_values: List[Any]