# Demo vs. Live Feature Matrix & System Disclosures

| Feature Module | Prototype Implementation Status | Mode Label in UI | Real / Persistent Behavior | Simulated / Demonstration Aspects |
| :--- | :--- | :--- | :--- | :--- |
| **Database Persistence** | **Fully Implemented** | `REAL_DATA` | Stored in relational tables via SQLAlchemy & Alembic; persists across restarts | None (real relational database engine) |
| **Supplier Directory** | **Fully Implemented** | `SAMPLE_DATA` | Real queries, filtering by country, process, MOQ, and lead time | Supplier companies and addresses are synthetic demonstration records |
| **Natural Language Sourcing** | **Fully Implemented** | `DEMO / LIVE` | Extracts quantities, dimensions, tolerances, materials; saves confirmed records to database | Uses deterministic regex/keyword parser when offline; cloud LLM when configured |
| **RFQ Workflow** | **Fully Implemented** | `DEMO WORKFLOW` | Real database records for RFQs, invited suppliers, deadlines, and terms | RFQ invitations are simulated internal records; no external emails are sent |
| **Quotation Comparison** | **Fully Implemented** | `WEIGHTED EVALUATION` | Dynamic user-adjusted weights, mathematical score normalization, DB persistence | Sample supplier offers; no binding contracts moved |
| **Purchase Orders (POs)** | **Fully Implemented** | `LIFECYCLE AUDITED` | Created upon quote acceptance; strict status state machine transition validation | Simulated payment transfer; no real banking integration |
| **Shipment Tracking** | **Partially Implemented** | `SIMULATED TRACKING` | Status updates logged to audit table with timestamps and author records | Generates simulated carrier tracking code (`SIM-TRK-XXXX`); no live GPS courier API |
| **Specialist AI Council** | **Fully Implemented** | `SIMULATED AGENT OUTPUT` | 6 specialist agents with structured schemas, inputs, outputs, assumptions, warnings | Deterministic Python heuristic engine when offline; real cloud LLM when configured |
| **Engineering BOM** | **Fully Implemented** | `AI DRAFT — REVIEW REQ` | Add/delete/edit line items, subtotal calculation, CSV file generation & download | Does not generate certified CAD drawings or validate tool deflection geometry |
| **Trade & Customs** | **Fully Implemented** | `ESTIMATE — NOT LEGAL DETERMINATION` | Computes CIF, Basic Customs Duty, IGST, SWS, and compliance documentation checklist | Illustrative reference rates; not a legal customs classification |
| **Analytics Dashboard** | **Fully Implemented** | `REAL_DATA` | Metric cards and charts aggregate directly from stored orders, quotes, and RFQs | Initial figures reflect seeded demo dataset until more records are added |
