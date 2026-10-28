from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.agents.orchestrator import AgentOrchestrator
from app.schemas.agent import AgentWorkflowRequest, AgentRunOut

router = APIRouter(prefix="/agents", tags=["AI Procurement Workspace"])


@router.post("/run", response_model=AgentRunOut)
async def run_agent_workflow(req: AgentWorkflowRequest, db: Session = Depends(get_db)):
    return await AgentOrchestrator.run_workflow(db, req)


@router.get("/runs/{run_id}", response_model=AgentRunOut)
def get_agent_run(run_id: int, db: Session = Depends(get_db)):
    run = AgentOrchestrator.get_run_by_id(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found")
    return run


@router.get("/history")
def get_agent_run_history(limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
    runs = AgentOrchestrator.get_run_history(db, limit=limit)
    return [
        {
            "id": r.id,
            "run_code": r.run_code,
            "prompt": r.prompt,
            "mode": r.mode,
            "status": r.status,
            "summary": r.summary,
            "started_at": r.started_at
        } for r in runs
    ]
