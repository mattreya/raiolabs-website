from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

from app.config import STATIC_DIR
from app.lab_manager import lab_mgr
from app.netclaw_service import netclaw
from app.personal_agent_service import personal_agent
from app.terminal_server import handle_terminal_ws
from app.models import (
    HintRequest,
    NetClawChatRequest,
    NetClawResponse,
    PersonalAgentChatRequest,
    PersonalAgentResponse,
    ValidationResult
)

app = FastAPI(title="Containerlab CCNP Studio with NetClaw AI Mentor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize with the default lab
default_lab_id = "encor_ospf_mtu"
if default_lab_id in lab_mgr.labs:
    lab_mgr.switch_lab(default_lab_id)

@app.get("/api/labs")
def get_catalog():
    """List available CCNP lab scenarios."""
    return lab_mgr.get_catalog()

@app.get("/api/labs/{lab_id}")
def get_lab_detail(lab_id: str):
    """Load and switch to a specific CCNP lab."""
    try:
        lab = lab_mgr.switch_lab(lab_id)
        return lab
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/labs/{lab_id}/reset")
def reset_lab(lab_id: str):
    """Reset lab to baseline seeded state."""
    try:
        lab = lab_mgr.switch_lab(lab_id)
        return {"status": "reset_success", "lab": lab}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/labs/{lab_id}/validate", response_model=ValidationResult)
def validate_lab(lab_id: str):
    """Run pyATS-style verification checks against the lab objective."""
    if lab_mgr.active_lab_id != lab_id:
        lab_mgr.switch_lab(lab_id)
    return lab_mgr.validate_current_lab()

@app.post("/api/netclaw/review", response_model=NetClawResponse)
def netclaw_review(req: Dict[str, str]):
    """Trigger NetClaw to inspect configs using pyATS Genie parsers."""
    lab_id = req.get("lab_id", lab_mgr.active_lab_id or "encor_ospf_mtu")
    res = netclaw.review_configs(lab_id)
    return res

@app.post("/api/netclaw/chat", response_model=NetClawResponse)
def netclaw_chat(req: NetClawChatRequest):
    """Chat interactively with NetClaw AI Mentor."""
    res = netclaw.answer_student_chat(req.lab_id, req.message, req.context_node)
    return res

@app.post("/api/netclaw/hint", response_model=NetClawResponse)
def get_hint(req: HintRequest):
    """Get progressive Socratic hint (Tier 1, 2, or 3)."""
    lab = lab_mgr.get_lab_detail(req.lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    hints = lab.get("hints", [])
    matching = next((h for h in hints if h.get("level") == req.level), None)
    if not matching and hints:
        matching = hints[-1]
        
    reply = f"**{matching.get('title', 'Hint')}**\n\n{matching.get('content', '')}"
    return {
        "reply": reply,
        "diagnostics": None,
        "structured_findings": [f"Hint Level {req.level} of {len(hints)}"],
        "level_hint": str(req.level)
    }

@app.post("/api/agent/chat", response_model=PersonalAgentResponse)
async def personal_agent_chat(req: PersonalAgentChatRequest):
    """Consult the student's personal cloud AI agent (Claude, OpenAI, Google) with live lab telemetry."""
    prov_low = req.provider.lower().strip()
    if prov_low not in ["local", "builtin", "ccie"]:
        if not req.api_key or not req.api_key.strip():
            raise HTTPException(status_code=400, detail="Missing API Key. Please enter your provider API key in settings.")
    
    res = await personal_agent.chat(
        provider=req.provider,
        api_key=req.api_key or "",
        message=req.message,
        lab_id=req.lab_id,
        model=req.model,
        history=req.history
    )
    return res

@app.websocket("/ws/terminal/{lab_id}/{node_name}")
async def terminal_websocket(websocket: WebSocket, lab_id: str, node_name: str):
    """Interactive WebSocket endpoint for xterm.js terminals."""
    await handle_terminal_ws(websocket, lab_id, node_name)

# Mount static frontend
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
@app.head("/")
def serve_index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "Containerlab CCNP Web Studio backend running."}
