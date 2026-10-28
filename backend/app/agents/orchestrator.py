import json
import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.agent import AgentRun, AgentRunEvent
from app.models.sourcing import SourcingRequest
from app.schemas.agent import AgentWorkflowRequest, AgentRunOut, AgentStepResult
from app.agents.specialists import (
    ProcurementAgent,
    SupplierMatchingAgent,
    EngineeringAgent,
    TradeComplianceAgent,
    NegotiationAgent,
    CoordinatorAgent
)
from app.agents.llm_provider import LLMProvider
from app.core.config import settings


class AgentOrchestrator:

    @classmethod
    async def run_workflow(cls, db: Session, req: AgentWorkflowRequest) -> AgentRunOut:
        is_live = LLMProvider.is_live_configured() and not req.force_demo_mode
        active_mode = "LIVE" if is_live else "DEMO"

        count = db.query(AgentRun).count()
        run_code = f"RUN-2026-{(count + 1):03d}"

        # Fetch sourcing request if linked
        sourcing_req = None
        if req.sourcing_request_id:
            sourcing_req = db.query(SourcingRequest).filter(SourcingRequest.id == req.sourcing_request_id).first()

        # Create AgentRun record
        run_record = AgentRun(
            run_code=run_code,
            request_id=req.sourcing_request_id,
            prompt=req.prompt,
            provider="groq/openai" if is_live else "deterministic-demo",
            model=settings.LLM_MODEL if is_live else "demo-deterministic-v1",
            mode=active_mode,
            status="RUNNING",
            started_at=datetime.datetime.utcnow()
        )
        db.add(run_record)
        db.flush()

        events_out: List[AgentStepResult] = []

        # 1. Procurement Agent
        step1 = ProcurementAgent.execute(req.prompt, sourcing_req, db, mode=active_mode)
        events_out.append(step1)

        # 2. Supplier Matching Agent
        step2 = SupplierMatchingAgent.execute(req.prompt, sourcing_req, db, mode=active_mode)
        events_out.append(step2)

        # 3. Engineering Agent
        step3 = EngineeringAgent.execute(req.prompt, sourcing_req, db, mode=active_mode)
        events_out.append(step3)

        # 4. Trade & Compliance Agent
        step4 = TradeComplianceAgent.execute(req.prompt, sourcing_req, db, mode="ESTIMATE")
        events_out.append(step4)

        # 5. Negotiation Agent
        step5 = NegotiationAgent.execute(req.prompt, sourcing_req, db, mode=active_mode)
        events_out.append(step5)

        # 6. Coordinator Agent
        step6 = CoordinatorAgent.execute(req.prompt, sourcing_req, events_out, db, mode=active_mode)
        events_out.append(step6)

        # Persist all events
        for step in events_out:
            event_rec = AgentRunEvent(
                run_id=run_record.id,
                agent_name=step.agent_name,
                task=step.task,
                inputs=json.dumps(step.inputs_used),
                outputs=json.dumps(step.result),
                assumptions=json.dumps(step.assumptions),
                warnings=json.dumps(step.warnings),
                mode=step.mode,
                human_approval_required=step.human_approval_required,
                execution_order=step.execution_order,
                created_at=step.timestamp
            )
            db.add(event_rec)

        summary_text = step6.result.get("executive_summary", "Completed multi-agent analysis successfully.")
        run_record.summary = summary_text
        run_record.status = "COMPLETED"
        run_record.completed_at = datetime.datetime.utcnow()

        db.commit()
        db.refresh(run_record)

        return AgentRunOut(
            id=run_record.id,
            run_code=run_record.run_code,
            request_id=run_record.request_id,
            prompt=run_record.prompt,
            provider=run_record.provider,
            model=run_record.model,
            mode=run_record.mode,
            status=run_record.status,
            summary=run_record.summary,
            started_at=run_record.started_at,
            completed_at=run_record.completed_at,
            events=events_out
        )

    @classmethod
    def get_run_history(cls, db: Session, limit: int = 10) -> List[AgentRun]:
        return db.query(AgentRun).order_by(AgentRun.id.desc()).limit(limit).all()

    @classmethod
    def get_run_by_id(cls, db: Session, run_id: int) -> Optional[AgentRunOut]:
        run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
        if not run:
            return None

        events = []
        for e in run.events:
            events.append(AgentStepResult(
                agent_name=e.agent_name,
                task=e.task,
                inputs_used=json.loads(e.inputs or "{}"),
                result=json.loads(e.outputs or "{}"),
                assumptions=json.loads(e.assumptions or "[]"),
                warnings=json.loads(e.warnings or "[]"),
                mode=e.mode,
                human_approval_required=e.human_approval_required,
                timestamp=e.created_at,
                execution_order=e.execution_order
            ))

        return AgentRunOut(
            id=run.id,
            run_code=run.run_code,
            request_id=run.request_id,
            prompt=run.prompt,
            provider=run.provider,
            model=run.model,
            mode=run.mode,
            status=run.status,
            summary=run.summary,
            started_at=run.started_at,
            completed_at=run.completed_at,
            events=events
        )
