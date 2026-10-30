import uvicorn
import os
import sys

# Ensure app module can be found
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print("=" * 65)
    print("  Containerlab CCNP Web Studio with NetClaw AI Mentor")
    print(f"  Server running at: http://localhost:{port}")
    print("  Press CTRL+C to stop.")
    print("=" * 65)
    
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
