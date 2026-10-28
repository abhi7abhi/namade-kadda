# Namade Kadda - API Documentation

The Namade Kadda backend provides a fully documented RESTful API conforming to OpenAPI 3.0 standards. When running locally, interactive documentation is available at `http://127.0.0.1:8000/docs`.

---

## Base URL
```text
http://127.0.0.1:8000/api/v1
```

---

## 1. System Health
- `GET /health`
  - Returns service status, database connectivity verification, active AI mode (`LIVE` or `DEMO`), and configuration details.

---

## 2. Supplier Discovery
- `GET /suppliers`
  - **Query Parameters**:
    - `search`: Case-insensitive substring match on name, description, city, country.
    - `country`: Filter by country of manufacture (e.g., `India`, `Germany`).
    - `category`: Filter by process capability (e.g., `CNC Machining`, `Sheet Metal`).
    - `max_moq`: Maximum acceptable Minimum Order Quantity.
    - `max_lead_time`: Maximum turnaround lead time in days.
    - `page`: Page index (default: `1`).
    - `size`: Items per page (default: `12`).
  - **Response**: `{ items: Supplier[], total: number, page: number, size: number, pages: number }`

- `GET /suppliers/{id}`
  - Returns detailed supplier profile including certified manufacturing capabilities and catalog parts.

---

## 3. Natural Language Sourcing
- `POST /sourcing/parse`
  - **Request Body**: `{ raw_input: string }`
  - Extracts parameters (quantity, material, dimensions, tolerances, process, delivery schedule). Returns structured fields, confidence scores, and missing specification alerts.

- `POST /sourcing`
  - **Request Body**: `SourcingRequestCreate`
  - Persists confirmed sourcing specifications into PostgreSQL and assigns a unique `SR-2026-XXX` identifier.

- `GET /sourcing`
  - Lists all stored sourcing requests.

- `GET /sourcing/{id}`
  - Retrieves a specific sourcing request record.

---

## 4. RFQ (Request for Quotation)
- `POST /rfqs`
  - Creates a new RFQ linked to a sourcing request and dispatches invitations to designated supplier IDs.

- `GET /rfqs`
  - Lists RFQs with associated supplier invitation statuses.

- `GET /rfqs/{id}`
  - Retrieves RFQ details and linked quotations.

---

## 5. Quotation Comparison & Evaluation
- `POST /quotations`
  - Manually records a supplier quotation with unit price, total amount, MOQ, lead time, shipping estimate, and payment terms.

- `POST /quotations/compare/{rfq_id}`
  - **Request Body**: `{ price_weight: float, lead_time_weight: float, reliability_weight: float }`
  - Recalculates normalized scores (0-100), detects missing certification fields, and returns ranked offers with transparent explanations.

- `POST /quotations/{id}/accept`
  - **Request Body**: `{ acceptance_reason: string, generate_order: bool }`
  - Marks the offer as `ACCEPTED`, rejects competing offers with justification, and automatically initializes a Purchase Order.

- `POST /quotations/{id}/reject`
  - Records commercial rejection rationale.

---

## 6. Purchase Orders & Lifecycle Tracking
- `GET /orders`
  - Lists all purchase orders with current status and contract value.

- `GET /orders/{id}`
  - Retrieves order details, line items, and complete status audit history.

- `PATCH /orders/{id}/status`
  - **Request Body**: `{ new_status: string, notes: string, changed_by: string }`
  - Validates lifecycle transitions (`CONFIRMED` -> `IN_PRODUCTION` -> `READY_TO_SHIP` -> `SHIPPED` -> `DELIVERED`). Generates a simulated carrier tracking code on `SHIPPED`.

---

## 7. Engineering & BOM Builder
- `GET /bom/projects`
  - Lists BOM projects.

- `POST /bom/projects`
  - Creates a new BOM project with line items.

- `POST /bom/projects/generate`
  - **Request Body**: `{ sourcing_request_id?: number, title?: string }`
  - Engineering Agent draft synthesis producing structured sub-assembly line items.

- `POST /bom/projects/{id}/items`
  - Adds a new line item and automatically recalculates project subtotal.

- `DELETE /bom/items/{id}`
  - Deletes a line item and updates the parent BOM subtotal.

- `GET /bom/projects/{id}/export-csv`
  - Returns a downloadable CSV file.

---

## 8. Trade & Customs Estimation
- `POST /trade/estimate`
  - **Request Body**: `{ origin_country: string, destination_country: string, product_description: string, declared_value: float, currency: string, freight_insurance_estimate: float }`
  - Computes CIF value, Basic Customs Duty (BCD), IGST, Social Welfare Surcharge, candidate HS code, and mandatory filing checklist.

---

## 9. AI Multi-Agent Council
- `POST /agents/run`
  - **Request Body**: `{ prompt: string, sourcing_request_id?: number, force_demo_mode?: bool }`
  - Sequentially coordinates all 6 specialist agents and persists the run and intermediate events.

- `GET /agents/runs/{id}`
  - Returns execution telemetry, inputs, deliverables, assumptions, and warnings for each step.

- `GET /agents/history`
  - Lists recent agent workflow runs.

---

## 10. Analytics Dashboard
- `GET /analytics/dashboard`
  - Computes real-time telemetry from stored database records: RFQ status counts, order status counts, supplier quotes, and spend by month.
