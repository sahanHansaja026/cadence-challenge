# Cadence — Implementation Plan

## Goal

Build a small multi-tenant commission and payout application where finance users can import bookings, configure commission rules, generate monthly payout runs, and agents can view their own bookings and statements.

## Implementation Approach

### 1. Foundation and Architecture

* Review the existing schema, legacy module, CSV fixture, and project standards.
* Define the database model and create migrations.
* Choose between Prisma and the raw PostgreSQL `pg` driver and document the decision in an ADR.
* Set up the Express API structure, (Zod validation), API response contracts, and structured request logging.

### 2. Authentication and Multi-Tenancy

* Implement email/password authentication with bcrypt.
* Issue JWTs after successful login.
* Implement `COMPANY_ADMIN`, `FINANCE`, and `AGENT` roles.
* Enforce company isolation and role authorization on the server for every protected endpoint.
* Add tests for cross-company and cross-agent access.

### 3. Booking Import

* Implement CSV upload and validation.
* Store valid bookings and report rejected rows with their reasons.
* Make imports idempotent so the same booking/file cannot be counted twice.
* Measure import performance using the provided fixture and test data.

### 4. Commission Rules

* Implement effective-dated commission rule sets and volume tiers.
* Keep commission calculation separate from persistence so it can be tested independently.
* Add product-specific overrides if time permits.
* Use exact decimal arithmetic for all financial calculations.

### 5. Payouts and Refunds

* Generate monthly payout runs containing one line per agent.
* Support `DRAFT` and `FINALISED` states.
* Prevent modification of finalised financial records.
* Design refund handling so a refund does not mutate a finalised payout.
* Add tests for money calculations, payout totals, and finalisation.

### 6. Frontend

* Build the React + Vite + TypeScript application.
* Implement login, booking import, commission/rule views, payout run views, and agent statements.
* Handle loading, empty, and error states.
* Ensure agents can only access their own data.

### 7. Testing, Defects and Delivery

* Fix at least three real defects in the legacy module and add regression tests.
* Prioritise tests for tenant isolation, money calculations, import idempotency, authorisation, and finalised payout immutability.
* Add GitHub Actions to run `npm run verify` on every pull request.
* Maintain `QUESTIONS.md`, `DEFECTS.md`, `AI_USAGE.md`, and `CHANGELOG.md` throughout development.
* Measure and document import and statement performance.
* Finish with a known-gaps review, peer review, and demo preparation.

## Priorities

The priority is to complete and properly test the `MUST` requirements first. `SHOULD` requirements will be implemented after the core system is stable. Stretch goals will only be attempted if the core requirements are complete and tested.

## Delivery Strategy

Work will be divided into small feature branches and pull requests from the `dev` branch. Each change will be tested before merging, and conventional commit messages will be used. Requirements or change requests that are unclear will be documented as questions or explicit assumptions rather than silently guessed.
