import json
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.schemas.agent import AgentStepResult
from app.models.supplier import Supplier, SupplierCapability
from app.models.sourcing import SourcingRequest
from app.services.component_intelligence_service import ComponentIntelligenceService


class ProcurementAgent:
    @staticmethod
    def execute(prompt: str, sourcing_req: Optional[SourcingRequest], db: Session, mode: str = "DEMO") -> AgentStepResult:
        ci = ComponentIntelligenceService.search(db, prompt, mode="auto_detect")
        qty = sourcing_req.quantity if sourcing_req else 500
        budget = f"{sourcing_req.currency} {sourcing_req.target_budget}" if (sourcing_req and sourcing_req.target_budget) else "Market competitive benchmark"

        if ci.detected_type == "PRODUCT" and ci.components:
            category = ci.item_category
            total_est = sum((c.estimated_cost_reference or 0) * (c.quantity or 1) for c in ci.components)
            result_payload = {
                "strategy": f"Turnkey Manufacturing & Subcomponent Sourcing Strategy for {ci.item_name}",
                "target_product": ci.item_name,
                "recommended_lot_size": f"{qty} finished systems ({len(ci.components)} essential sub-assemblies per unit)",
                "target_pricing_bracket": f"Estimated reference BOM benchmark: ${total_est:.2f} USD / unit",
                "evaluation_criteria": [
                    {"criteria": "Subcomponent Quality & Cleanroom/EMS Standards", "suggested_weight": "40%"},
                    {"criteria": "Unit Price & Tooling Amortization", "suggested_weight": "35%"},
                    {"criteria": "Delivery Schedule & Buffer Stock", "suggested_weight": "25%"}
                ],
                "key_milestones": [
                    f"Issue structured RFQs for {len(ci.components)} key subcomponents",
                    f"First Article Inspection (FAI) on critical silicon and structural modules",
                    f"Pilot batch qualification before commercial scale run"
                ]
            }
        elif ci.detected_type in ("COMPONENT", "RAW_MATERIAL") and ci.products:
            category = ci.item_category
            result_payload = {
                "strategy": f"Strategic Component Allocation & Supplier Qualification for {ci.item_name}",
                "target_component": ci.item_name,
                "recommended_lot_size": f"{qty} units across primary product assemblies",
                "downstream_applications": [p.product_name for p in ci.products[:4]],
                "target_pricing_bracket": "Market competitive Tier-1 & Tier-2 vendor price index",
                "evaluation_criteria": [
                    {"criteria": "Specification Compliance & Mill/Fab Certifications", "suggested_weight": "45%"},
                    {"criteria": "Unit Pricing & Volume Rebate Tiers", "suggested_weight": "30%"},
                    {"criteria": "Production Capacity & Lead Time Buffer", "suggested_weight": "25%"}
                ],
                "key_milestones": [
                    f"Send technical inquiry for {ci.item_name} to qualified suppliers",
                    "Verify electrical and mechanical tolerances against datasheet",
                    "Audit vendor supply continuity and dual-source options"
                ]
            }
        else:
            category = sourcing_req.category if sourcing_req else "Industrial Fabrications"
            result_payload = {
                "strategy": "Dual-Sourcing RFP with Regional Tier-1 & Tier-2 Fabricators",
                "recommended_lot_size": f"{qty} units (Quarterly split: {qty // 2} initial + {qty // 2} replenishment)",
                "target_pricing_bracket": "$14.00 - $18.50 per unit based on standard sheet metal & stamping indices",
                "evaluation_criteria": [
                    {"criteria": "Unit Price & Tooling Amortization", "suggested_weight": "45%"},
                    {"criteria": "Delivery Schedule & Buffer Stock", "suggested_weight": "30%"},
                    {"criteria": "Quality Compliance & ISO 9001 Audits", "suggested_weight": "25%"}
                ],
                "key_milestones": [
                    "Issue structured RFQ to 3 verified suppliers",
                    "Receive quotation responses within 7 business days",
                    "Engineering sample sign-off (First Article Inspection) prior to batch run"
                ]
            }

        return AgentStepResult(
            agent_name="Procurement Agent",
            task="Requirement Structuring & Sourcing Strategy Formulation",
            inputs_used={"user_prompt": prompt, "category": category, "quantity": qty, "budget": budget},
            result=result_payload,
            assumptions=[
                "Standard commercial payment terms (Net 30) are agreeable to participating vendors.",
                "Packaging and inland destination transit are included in quotation scope."
            ],
            warnings=[
                "High raw material volatility or supply allocations may require price indexing clauses."
            ],
            mode=mode,
            human_approval_required=False,
            execution_order=1
        )


class SupplierMatchingAgent:
    @staticmethod
    def execute(prompt: str, sourcing_req: Optional[SourcingRequest], db: Session, mode: str = "DEMO") -> AgentStepResult:
        ci = ComponentIntelligenceService.search(db, prompt, mode="auto_detect")
        matched = []
        seen = set()

        if ci.detected_type == "PRODUCT" and ci.components:
            for comp in ci.components:
                for s in comp.supplier_matches:
                    if s.supplier_id not in seen:
                        seen.add(s.supplier_id)
                        matched.append({
                            "supplier_id": s.supplier_id,
                            "name": s.name,
                            "location": f"{s.city}, {s.country}",
                            "moq": s.moq,
                            "lead_time_days": s.lead_time_days,
                            "rating": float(s.rating),
                            "verification_status": s.verification_status,
                            "component_focus": comp.name,
                            "match_score": 96 if s.is_verified else 88
                        })
        elif ci.detected_type in ("COMPONENT", "RAW_MATERIAL"):
            sups = ComponentIntelligenceService.find_suppliers_for_component(db, ci.item_name, category=ci.item_category)
            for s in sups:
                if s.supplier_id not in seen:
                    seen.add(s.supplier_id)
                    matched.append({
                        "supplier_id": s.supplier_id,
                        "name": s.name,
                        "location": f"{s.city}, {s.country}",
                        "moq": s.moq,
                        "lead_time_days": s.lead_time_days,
                        "rating": float(s.rating),
                        "verification_status": s.verification_status,
                        "component_focus": ci.item_name,
                        "match_score": 95 if s.is_verified else 86
                    })

        if not matched:
            suppliers = db.query(Supplier).limit(4).all()
            for s in suppliers:
                matched.append({
                    "supplier_id": s.id,
                    "name": s.name,
                    "location": f"{s.city}, {s.country}",
                    "moq": s.moq,
                    "lead_time_days": s.lead_time_days,
                    "rating": float(s.rating),
                    "verification_status": s.verification_status,
                    "match_score": 94 if s.country == "India" else 88
                })

        return AgentStepResult(
            agent_name="Supplier Matching Agent",
            task="Supplier Catalog Discovery & Capability Filtering",
            inputs_used={
                "search_criteria": ci.item_name if ci.detected_type != "UNKNOWN" else (sourcing_req.manufacturing_process if sourcing_req else "CNC / Sheet Metal"),
                "destination": sourcing_req.destination_country if sourcing_req else "India"
            },
            result={
                "matched_suppliers": matched[:4],
                "recommended_primary": matched[0]["name"] if matched else "Apex Precision Engineering",
                "recommended_backup": matched[1]["name"] if len(matched) > 1 else "Bharat ForgeTech Solutions"
            },
            assumptions=[
                "Suppliers maintain active production capacity for the requested lead time bracket.",
                "Marketplace vendor profiles reflect baseline operational readiness."
            ],
            warnings=[
                "Supplier certifications shown are platform verification records and should be audited prior to major contract award."
            ],
            mode=mode,
            human_approval_required=True,
            execution_order=2
        )


class EngineeringAgent:
    @staticmethod
    def execute(prompt: str, sourcing_req: Optional[SourcingRequest], db: Session, mode: str = "DEMO") -> AgentStepResult:
        ci = ComponentIntelligenceService.search(db, prompt, mode="auto_detect")

        if ci.detected_type == "PRODUCT" and ci.components:
            bom_preview = [
                {
                    "part": c.name,
                    "category": c.category,
                    "quantity": f"{c.quantity} {c.unit}",
                    "specification": (c.specification_details[:50] + "...") if c.specification_details else c.typical_purpose,
                    "est_cost": f"${c.estimated_cost_reference:.2f}" if c.estimated_cost_reference else "Market quote",
                    "status": c.verification_status
                } for c in ci.components[:6]
            ]
            completeness = "94% (Verified Product Architecture)"
            missing_specs = ["First Article Inspection (FAI) sign-off required", "Specific firmware/driver integration"]
        elif ci.detected_type in ("COMPONENT", "RAW_MATERIAL") and ci.products:
            bom_preview = [
                {
                    "product": p.product_name,
                    "category": p.product_category,
                    "how_used": (p.how_component_is_used[:50] + "..."),
                    "sibling_components": ", ".join(p.other_key_components[:2]) if p.other_key_components else "Integrated",
                    "status": p.verification_status
                } for p in ci.products[:6]
            ]
            completeness = "90% (Multi-Product Integration Mapped)"
            missing_specs = ["PCB form-factor footprint matching", "Thermal dissipation heat spreader profile"]
        else:
            missing_specs = []
            if sourcing_req and not sourcing_req.tolerances:
                missing_specs.append("General machining tolerances (recommended default: ISO 2768-m)")
            if sourcing_req and not sourcing_req.material_grade:
                missing_specs.append("Specific metal alloy designation (e.g. AISI 304 vs 316)")

            bom_preview = [
                {"part": "Mounting Bracket Base", "material": "SS 304 / 4mm", "est_cost": "$12.50", "status": "DRAFT"},
                {"part": "Reinforcement Rib Gusset", "material": "SS 304 / 4mm", "est_cost": "$3.20", "status": "DRAFT"},
                {"part": "Hardware Fastener Kit", "material": "A2-70 Stainless", "est_cost": "$1.80", "status": "COTS"}
            ]
            completeness = "85%"

        return AgentStepResult(
            agent_name="Engineering Agent",
            task="Specification Completeness Audit & Draft BOM Synthesis",
            inputs_used={
                "raw_specs": sourcing_req.raw_input if sourcing_req else prompt,
                "item_name": ci.item_name
            },
            result={
                "spec_completeness_rating": completeness,
                "missing_tolerances_or_standards": missing_specs,
                "draft_bom_preview": bom_preview,
                "disclaimer": "AI-generated draft synthesized from marketplace intelligence. Engineering sign-off required before tooling."
            },
            assumptions=[
                "Standard engineering tolerances and cleanroom packaging guidelines apply.",
                "Critical component dimensions follow standard commercial form factors."
            ],
            warnings=[
                "Specification verification must be conducted by certified technical engineers prior to purchase order issuance."
            ],
            mode=mode,
            human_approval_required=True,
            execution_order=3
        )


class TradeComplianceAgent:
    @staticmethod
    def execute(prompt: str, sourcing_req: Optional[SourcingRequest], db: Session, mode: str = "DEMO") -> AgentStepResult:
        ci = ComponentIntelligenceService.search(db, prompt, mode="auto_detect")
        item_lower = (ci.item_name or prompt).lower()

        # Dynamic HS Code mapping
        if "phone" in item_lower or "smartphone" in item_lower:
            hs_code = "8517.13.00 (Smartphones and Cellular Telephones)"
            b_duty = "20.0%"
            product_class = "Cellular Telecommunications Equipment"
        elif "laptop" in item_lower or "computer" in item_lower:
            hs_code = "8471.30.10 (Portable Automatic Data Processing Machines)"
            b_duty = "0.0% (ITA-1 Exemption)"
            product_class = "Computing & Data Processing"
        elif "vehicle" in item_lower or "ev" in item_lower:
            hs_code = "8703.80.00 (Electric Motor Vehicles)"
            b_duty = "15.0%"
            product_class = "Electric Automotive Propulsion"
        elif "drone" in item_lower:
            hs_code = "8806.22.00 (Unmanned Aircraft / Industrial Drones)"
            b_duty = "10.0%"
            product_class = "Remotely Piloted Aerial Systems"
        elif "inverter" in item_lower:
            hs_code = "8504.40.80 (Static Converters / Solar Inverters)"
            b_duty = "7.5%"
            product_class = "Photovoltaic Power Inverters"
        elif "chip" in item_lower or "semiconductor" in item_lower or "processor" in item_lower:
            hs_code = "8542.31.00 (Electronic Integrated Circuits: Processors & Controllers)"
            b_duty = "0.0% (ITA-1 Duty Free)"
            product_class = "Semiconductor Microelectronics"
        elif "battery" in item_lower:
            hs_code = "8507.60.00 (Lithium-ion Accumulators & Batteries)"
            b_duty = "5.0%"
            product_class = "Electrochemical Energy Storage"
        elif "copper" in item_lower:
            hs_code = "7409.11.00 (Refined Copper Plates, Sheets & Strip)"
            b_duty = "5.0%"
            product_class = "Non-Ferrous Metallurgical Semis"
        elif "display" in item_lower:
            hs_code = "8528.52.00 (Monitors & Electronic Display Panels)"
            b_duty = "10.0%"
            product_class = "Optoelectronic Visual Displays"
        elif "pcb" in item_lower or "circuit board" in item_lower:
            hs_code = "8534.00.00 (Printed Circuits)"
            b_duty = "0.0% (ITA-1 Duty Free)"
            product_class = "Printed Circuit Board Interconnects"
        elif "valve" in item_lower:
            hs_code = "8481.20.00 (Valves for Oleohydraulic or Pneumatic Transmissions)"
            b_duty = "7.5%"
            product_class = "Fluid Power Hydraulics"
        else:
            hs_code = "7326.90.99 (Articles of iron or steel, others)"
            b_duty = "7.5%"
            product_class = "Fabricated Industrial Metal Articles"

        return AgentStepResult(
            agent_name="Trade & Compliance Agent",
            task="Preliminary Customs & Trade Documentation Analysis",
            inputs_used={
                "item": ci.item_name,
                "origin": "Global / Multi-Regional",
                "destination": sourcing_req.destination_country if sourcing_req else "India",
                "product_class": product_class
            },
            result={
                "candidate_hs_code": hs_code,
                "indicative_tariff_summary": {
                    "basic_customs_duty": b_duty,
                    "igst_rate": "18.0%",
                    "social_welfare_surcharge": "10% of BCD"
                },
                "required_trade_filings": [
                    "Commercial Invoice & Detailed Packing List",
                    "Certificate of Origin (COO)",
                    "Declaration of Conformity (CE / BIS / RoHS / UL)",
                    "Bill of Entry filing on ICEGATE with valid GSTIN & IEC"
                ],
                "compliance_notice": "ESTIMATE — NOT A CUSTOMS OR LEGAL DETERMINATION"
            },
            assumptions=[
                "Import valuation follows transaction value method under WTO Valuation Agreement.",
                "Goods are not subject to anti-dumping or countervailing duties."
            ],
            warnings=[
                "Actual duty liability is strictly assessed by customs officials at the port of clearance based on the finalized Bill of Entry."
            ],
            mode="ESTIMATE",
            human_approval_required=False,
            execution_order=4
        )


class NegotiationAgent:
    @staticmethod
    def execute(prompt: str, sourcing_req: Optional[SourcingRequest], db: Session, mode: str = "DEMO") -> AgentStepResult:
        ci = ComponentIntelligenceService.search(db, prompt, mode="auto_detect")
        target_name = ci.item_name if ci.detected_type != "UNKNOWN" else "Commercial Parts"

        return AgentStepResult(
            agent_name="Negotiation Agent",
            task="Commercial Counter-Offer & Trade-Off Modeling",
            inputs_used={"target_batch": sourcing_req.quantity if sourcing_req else 500, "item": target_name},
            result={
                "suggested_counter_offer": {
                    "proposed_discount": "6.5% rebate on batches above 750 units",
                    "lead_time_counter": "Request 18 calendar days instead of 25 days with staged air delivery for pilot units",
                    "payment_term_proposal": "20% advance on tooling sign-off, 80% Net 30 upon delivery and incoming inspection"
                },
                "trade_off_analysis": [
                    {"lever": "Batch Volume", "upside": "-8% unit cost", "downside": "Higher inventory holding cost"},
                    {"lever": "Air Freight Expedited", "upside": "Cuts lead time by 10-14 days", "downside": "+$1.40/unit freight premium"},
                    {"lever": "Payment Terms", "upside": "Improves cash flow buffer", "downside": "May reduce supplier discounting willingness"}
                ]
            },
            assumptions=[
                "Supplier has available capacity to absorb order increments without new capex tooling."
            ],
            warnings=[
                "Counter-offers must be reviewed and signed off by the commercial procurement officer before sending."
            ],
            mode=mode,
            human_approval_required=True,
            execution_order=5
        )


class CoordinatorAgent:
    @staticmethod
    def execute(
        prompt: str,
        sourcing_req: Optional[SourcingRequest],
        prior_steps: List[AgentStepResult],
        db: Session,
        mode: str = "DEMO"
    ) -> AgentStepResult:
        ci = ComponentIntelligenceService.search(db, prompt, mode="auto_detect")
        item_title = ci.item_name if ci.detected_type != "UNKNOWN" else "Procurement Requirement"

        summary_text = (
            f"Multi-Agent Procurement Pipeline completed comprehensive assessment for {item_title}. "
            f"Sourcing strategy formulated with verified marketplace suppliers. "
            f"Engineering architecture evaluated with completeness audit and draft BOM synthesis. "
            f"Trade compliance and commercial counter-offer modeled. "
            f"Recommended next action: review draft RFQ, confirm engineering specifications, and invite matched suppliers."
        )

        return AgentStepResult(
            agent_name="Coordinator Agent",
            task="Workflow Synthesis & Executive Procurement Briefing",
            inputs_used={"steps_completed": len(prior_steps), "objective": prompt, "item": item_title},
            result={
                "executive_summary": summary_text,
                "readiness_status": "READY_FOR_RFQ_ISSUANCE",
                "action_items": [
                    {"step": 1, "action": f"Confirm engineering specifications for {item_title}", "completed": False},
                    {"step": 2, "action": "Approve RFQ dispatch to primary and secondary verified suppliers", "completed": False},
                    {"step": 3, "action": "Request material mill test report and compliance certificate with initial quote", "completed": True}
                ],
                "confidence_score": 0.95
            },
            assumptions=[
                "All prior agent outputs have been reviewed by the procurement workspace lead."
            ],
            warnings=[
                "All automated agent recommendations are advisory inputs requiring human confirmation before binding commitments."
            ],
            mode=mode,
            human_approval_required=False,
            execution_order=6
        )
