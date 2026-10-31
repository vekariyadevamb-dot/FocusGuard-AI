"""
Entrypoint for FocusGuard AI Python Vision Engine
Runs FastAPI with Uvicorn on 127.0.0.1:8765
"""

import uvicorn
import sys
import os

# Ensure current directory is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if __name__ == "__main__":
    uvicorn.run(
        "backend.api:app",
        host="127.0.0.1",
        port=8765,
        log_level="info",
        reload=False
    )
