from fastapi import APIRouter, HTTPException
from backend.services.data_generator import generator_instance

router = APIRouter(prefix="/api/evaluate", tags=["evaluation"])


@router.get("/real-data-info")
async def get_real_data_info():
    """Return statistics about the currently loaded real dataset."""
    df = generator_instance.get_real_data()

    col_info = []
    for col in df.columns:
        info = {
            "name": col,
            "dtype": str(df[col].dtype),
            "missing_pct": round(df[col].isna().mean() * 100, 2),
            "unique_count": int(df[col].nunique()),
        }
        if df[col].dtype in ["float64", "int64", "int32"]:
            info["min"] = round(float(df[col].min()), 2)
            info["max"] = round(float(df[col].max()), 2)
            info["mean"] = round(float(df[col].mean()), 2)
        else:
            info["top_values"] = df[col].value_counts().head(3).to_dict()
        col_info.append(info)

    return {
        "rows": len(df),
        "columns": len(df.columns),
        "column_info": col_info,
    }