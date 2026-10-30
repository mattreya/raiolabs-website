from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent
LABS_DIR = BASE_DIR / "labs"
STATIC_DIR = BASE_DIR / "static"

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8080"))

# Check if Containerlab binary is installed on the host
CLAB_BINARY = os.getenv("CLAB_BINARY", "containerlab")
