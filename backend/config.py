from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Privacy-Preserving Synthetic Hospital Data Generator"
    debug: bool = True
    max_rows: int = 10000
    default_epsilon: float = 1.0
    default_delta: float = 1e-5
    model_save_path: str = "./saved_models"
cors_origins: list = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://synthetic-healthcare-data.vercel.app",
]
    class Config:
        env_file = ".env"

settings = Settings()