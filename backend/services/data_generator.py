import pandas as pd
import numpy as np
import time
import logging
from typing import Optional
from sdv.single_table import CTGANSynthesizer, GaussianCopulaSynthesizer, TVAESynthesizer
from sdv.metadata import SingleTableMetadata
from backend.models.schemas import GenerateRequest, GeneratorType

logger = logging.getLogger(__name__)


def build_sample_hospital_data(n: int = 1000) -> pd.DataFrame:
    """Generate realistic sample hospital data for demonstration."""
    np.random.seed(42)

    n_patients = n
    ages = np.random.normal(52, 18, n_patients).clip(1, 99).astype(int)
    genders = np.random.choice(["Male", "Female", "Other"], n_patients, p=[0.48, 0.50, 0.02])
    blood_types = np.random.choice(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
                                   n_patients, p=[0.34, 0.06, 0.09, 0.02, 0.03, 0.01, 0.38, 0.07])

    diagnoses = np.random.choice(
        ["Hypertension", "Type 2 Diabetes", "Coronary Artery Disease",
         "Pneumonia", "Appendicitis", "Fracture", "Stroke",
         "Chronic Kidney Disease", "Asthma", "Depression"],
        n_patients,
        p=[0.20, 0.15, 0.12, 0.10, 0.08, 0.10, 0.07, 0.06, 0.07, 0.05]
    )

    departments = np.random.choice(
        ["Cardiology", "Internal Medicine", "Emergency", "Orthopedics",
         "Neurology", "Pulmonology", "Nephrology", "Psychiatry"],
        n_patients
    )

    los = np.random.exponential(4, n_patients).clip(1, 30).astype(int)  # length of stay in days
    admission_costs = (los * np.random.normal(1200, 300, n_patients)).clip(500, 50000).round(2)

    systolic_bp = np.random.normal(125, 18, n_patients).clip(80, 200).round(1)
    diastolic_bp = np.random.normal(80, 12, n_patients).clip(50, 130).round(1)
    heart_rate = np.random.normal(78, 14, n_patients).clip(40, 140).astype(int)
    temperature = np.random.normal(98.4, 0.8, n_patients).clip(95, 105).round(1)
    oxygen_sat = np.random.normal(97, 2, n_patients).clip(85, 100).round(1)

    outcomes = np.where(
        np.random.random(n_patients) < 0.05, "Deceased",
        np.where(np.random.random(n_patients) < 0.15, "Transferred", "Discharged")
    )
    readmitted = np.random.choice([True, False], n_patients, p=[0.12, 0.88])

    insurance_types = np.random.choice(
        ["Medicare", "Medicaid", "Private", "Self-Pay", "Other"],
        n_patients,
        p=[0.30, 0.20, 0.35, 0.10, 0.05]
    )

    df = pd.DataFrame({
        "age": ages,
        "gender": genders,
        "blood_type": blood_types,
        "diagnosis": diagnoses,
        "department": departments,
        "length_of_stay_days": los,
        "admission_cost_usd": admission_costs,
        "systolic_bp": systolic_bp,
        "diastolic_bp": diastolic_bp,
        "heart_rate_bpm": heart_rate,
        "temperature_f": temperature,
        "oxygen_saturation_pct": oxygen_sat,
        "discharge_outcome": outcomes,
        "readmitted_30_days": readmitted,
        "insurance_type": insurance_types,
    })

    return df


class SyntheticDataGenerator:
    def __init__(self):
        self.real_data: Optional[pd.DataFrame] = None
        self.metadata: Optional[SingleTableMetadata] = None
        self.synthesizer = None
        self._load_or_create_real_data()

    def _load_or_create_real_data(self):
        """Load real data or generate sample data."""
        import os
        data_path = os.path.join(os.path.dirname(__file__), "../data/sample_hospital.csv")
        if os.path.exists(data_path):
            self.real_data = pd.read_csv(data_path)
            logger.info(f"Loaded real data: {self.real_data.shape}")
        else:
            self.real_data = build_sample_hospital_data(1000)
            os.makedirs(os.path.dirname(data_path), exist_ok=True)
            self.real_data.to_csv(data_path, index=False)
            logger.info("Generated and saved sample hospital data")

        self.metadata = SingleTableMetadata()
        self.metadata.detect_from_dataframe(self.real_data)

        # Manually mark boolean columns
        for col in self.real_data.columns:
            if self.real_data[col].dtype == bool:
                self.metadata.update_column(column_name=col, sdtype="boolean")

    def generate(self, request: GenerateRequest) -> tuple[pd.DataFrame, float]:
        """Train and sample from a generative model."""
        start = time.time()

        if request.generator_type == GeneratorType.CTGAN:
            self.synthesizer = CTGANSynthesizer(
                metadata=self.metadata,
                epochs=request.epochs,
                batch_size=request.batch_size,
                verbose=False,
            )
        elif request.generator_type == GeneratorType.GAUSSIAN_COPULA:
            self.synthesizer = GaussianCopulaSynthesizer(metadata=self.metadata)
        elif request.generator_type == GeneratorType.TVAE:
            self.synthesizer = TVAESynthesizer(
                metadata=self.metadata,
                epochs=request.epochs,
                batch_size=request.batch_size,
            )

        self.synthesizer.fit(self.real_data)
        synthetic_df = self.synthesizer.sample(num_rows=request.num_rows)

        elapsed = time.time() - start
        return synthetic_df, elapsed

    def get_real_data(self) -> pd.DataFrame:
        return self.real_data.copy()


generator_instance = SyntheticDataGenerator()