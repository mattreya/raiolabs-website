from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class LabSummary(BaseModel):
    id: str
    title: str
    track: str
    difficulty: str
    estimatedTime: str
    description: str

class LabDetail(LabSummary):
    objective: str
    nodes: List[Dict[str, Any]]
    topologyVisual: Dict[str, Any]
    hints: List[Dict[str, Any]]
    validation: Dict[str, Any]
    viewpointQuestions: Optional[List[Dict[str, Any]]] = None
    examPracticeCommands: Optional[List[Dict[str, Any]]] = None

class CommandRequest(BaseModel):
    command: str

class CommandResponse(BaseModel):
    output: str
    prompt: str

class HintRequest(BaseModel):
    lab_id: str
    level: int = 1

class NetClawChatRequest(BaseModel):
    lab_id: str
    message: str
    context_node: Optional[str] = None

class NetClawResponse(BaseModel):
    reply: str
    diagnostics: Optional[Dict[str, Any]] = None
    structured_findings: Optional[List[str]] = None
    level_hint: Optional[str] = None

class PersonalAgentChatRequest(BaseModel):
    provider: str = Field(..., description="google, openai, or anthropic")
    api_key: str = Field(..., description="User's personal API key")
    model: Optional[str] = None
    lab_id: str
    message: str
    history: Optional[List[Dict[str, str]]] = None

class PersonalAgentResponse(BaseModel):
    reply: str
    provider: str
    model: str

class ValidationResult(BaseModel):
    solved: bool
    score: int
    total: int
    checks: List[Dict[str, Any]]
    feedback: str
    viewpointQuestions: Optional[List[Dict[str, Any]]] = None
    examPracticeCommands: Optional[List[Dict[str, Any]]] = None
