from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class AgentStepResult(BaseModel):
    agent_name: str
    task: str
    inputs_used: Dict[str, Any]
    result: Dict[str, Any]
    assumptions: List[str] = []
    warnings: List[str] = []
    mode: str = "DEMO"  # LIVE, DEMO, or ESTIMATE
    human_approval_required: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    execution_order: int = 1


class AgentWorkflowRequest(BaseModel):
    prompt: str = Field(..., min_length=3, description="Prompt or procurement objective for the specialist agents")
    sourcing_request_id: Optional[int] = None
    force_demo_mode: bool = False


class AgentRunOut(BaseModel):
    id: int
    run_code: str
    request_id: Optional[int] = None
    prompt: str
    provider: str
    model: str
    mode: str  # LIVE or DEMO
    status: str
    summary: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    events: List[AgentStepResult] = []

    model_config = ConfigDict(from_attributes=True)
