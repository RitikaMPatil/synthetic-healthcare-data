import logging
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
import pandas as pd
import io

from backend.models.schemas import GenerateRequest, GenerateResponse
from backend.services.data_generator import generator_instance
from backend.services.privacy_engine import apply_privacy, compute_privacy_metrics
from backend.services.evaluator import evaluate

router = APIRouter(prefix="/api/generate", tags=["generation"])
logger = logging.getLogger(__name__)

_last_synthetic: pd.DataFrame | None = None


@router.post("/", response_model=GenerateResponse)
async def generate_synthetic_data(request: GenerateRequest):
    """Main endpoint: train model → apply privacy → evaluate → return results."""
    global _last_synthetic

    try:
        logger.info(f"Starting generation: {request.model_dump()}")

        # 1. Generate synthetic data
        synthetic_df, gen_time = generator_instance.generate(request)

        # 2. Apply privacy mechanism
        synthetic_df = apply_privacy(synthetic_df, request)

        # 3. Store for later download
        _last_synthetic = synthetic_df

        # 4. Evaluate
        real_df = generator_instance.get_real_data()
        privacy_metrics = compute_privacy_metrics(real_df, synthetic_df)
        eval_result = evaluate(real_df, synthetic_df, privacy_metrics)

        # 5. Build preview (first 10 rows, serializable)
        preview = synthetic_df.head(10).fillna("").astype(str).to_dict(orient="records")
        csv_data = synthetic_df.to_csv(index=False)

        return GenerateResponse(
            success=True,
            message="Synthetic data generated successfully",
            rows_generated=len(synthetic_df),
            columns=list(synthetic_df.columns),
            preview=preview,
            evaluation=eval_result,
            generation_time_seconds=round(gen_time, 2),
            csv_data=csv_data,

        )

    except Exception as e:
        logger.exception("Generation failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download")
async def download_synthetic_csv():
    """Download the last generated synthetic dataset as CSV."""
    if _last_synthetic is None:
        raise HTTPException(status_code=404, detail="No synthetic data generated yet")

    buffer = io.StringIO()
    _last_synthetic.to_csv(buffer, index=False)
    buffer.seek(0)

    return StreamingResponse(
        io.BytesIO(buffer.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=synthetic_hospital_data.csv"},
    )


@router.post("/upload-real-data")
async def upload_real_data(file: UploadFile = File(...)):
    """Allow users to upload their own real hospital CSV data."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))

    if df.empty or len(df.columns) < 2:
        raise HTTPException(status_code=400, detail="CSV must have at least 2 columns and some rows")

    from sdv.metadata import SingleTableMetadata
    generator_instance.real_data = df
    generator_instance.metadata = SingleTableMetadata()
    generator_instance.metadata.detect_from_dataframe(df)

    col_stats = []
    for col in df.columns:
        col_stats.append({
            "name": col,
            "dtype": str(df[col].dtype),
            "missing_pct": round(df[col].isna().mean() * 100, 2),
            "unique_count": int(df[col].nunique()),
            "sample_values": df[col].dropna().head(3).tolist(),
        })

    return {
        "success": True,
        "rows": len(df),
        "columns": len(df.columns),
        "column_stats": col_stats,
    }