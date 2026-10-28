import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_code = Column(String(50), unique=True, index=True, nullable=False)  # e.g. "RUN-2026-004"
    request_id = Column(Integer, ForeignKey("sourcing_requests.id", ondelete="SET NULL"), nullable=True)
    prompt = Column(Text, nullable=False)
    provider = Column(String(50), default="demo", nullable=False)
    model = Column(String(100), default="demo-deterministic-v1", nullable=False)
    mode = Column(String(20), default="DEMO", nullable=False)  # LIVE or DEMO
    status = Column(String(50), default="COMPLETED", nullable=False)  # RUNNING, COMPLETED, FAILED
    summary = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    sourcing_request = relationship("SourcingRequest", back_populates="agent_runs")
    events = relationship("AgentRunEvent", back_populates="run", cascade="all, delete-orphan", order_by="AgentRunEvent.execution_order")


class AgentRunEvent(Base):
    __tablename__ = "agent_run_events"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("agent_runs.id", ondelete="CASCADE"), nullable=False)
    agent_name = Column(String(100), nullable=False)  # Procurement, Supplier Matching, Engineering, Trade, Negotiation, Coordinator
    task = Column(String(255), nullable=False)
    inputs = Column(Text, nullable=True)  # JSON string
    outputs = Column(Text, nullable=True)  # JSON or text result
    assumptions = Column(Text, nullable=True)  # JSON list
    warnings = Column(Text, nullable=True)  # JSON list
    mode = Column(String(20), default="DEMO", nullable=False)  # LIVE, DEMO, ESTIMATE
    human_approval_required = Column(Boolean, default=False, nullable=False)
    execution_order = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    run = relationship("AgentRun", back_populates="events")
