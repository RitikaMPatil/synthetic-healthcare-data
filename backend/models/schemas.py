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


class GenerateRequest(BaseModel):
    num_rows: int = Field(default=500, ge=10, le=10000, description="Number of synthetic rows to generate")
    generator_type: GeneratorType = Field(default=GeneratorType.CTGAN)
    privacy_mechanism: PrivacyMechanism = Field(default=PrivacyMechanism.DIFFERENTIAL_PRIVACY)
    epsilon: float = Field(default=1.0, ge=0.01, le=10.0, description="DP epsilon (lower = more private)")
    delta: float = Field(default=1e-5, description="DP delta")
    k_anonymity_k: int = Field(default=5, ge=2, le=50, description="k for k-anonymity")
    epochs: int = Field(default=300, ge=50, le=1000)
    batch_size: int = Field(default=500, ge=64, le=2048)


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