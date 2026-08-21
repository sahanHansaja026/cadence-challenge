# ADR-0006: Payout Runs and Commission Calculation

**Date:** 2026-08-18  
**Status:** Accepted  
**Decider:** Sahan Hansaja

## Context

Cadence calculates agent commissions from bookings.

Commission rates can depend on:

- Company
- Effective date
- Product
- Booking amount
- Commission rule type

A payout run represents the commission calculation for a defined period.

The system also needs to provide agent-level payout information.

## Decision

Represent payout processing using:

- `payout_runs`
- `payout_line_items`
- `payout_booking_items`
- `commission_rules`

A payout run contains a company, period, status, and total amount.

Payout runs are initially created as `DRAFT`.

Bookings within the payout period are evaluated against effective commission
rules.

Product-specific rules take priority over generic rules.

Commission is calculated from the booking amount and matching commission
rate.

Payout line items aggregate the calculated results by agent.

The final payout total is calculated from the stored payout line items.

## Consequences

### Positive

- Payout calculations are reproducible from stored booking and rule data.
- Commission rules can change over time using effective dates.
- Product-specific commission rules are supported.
- Agents can view their own payout information.
- Finance and company admins can view company-level payout information.

### Negative / Trade-offs

- Commission rule selection is more complex than using a single fixed rate.
- Payout creation performs several database queries.
- Changes to commission rules require careful effective-date handling.
- Aggregated payout lines require additional booking-level records when
  detailed traceability is required.

## Alternatives Considered

| Option                                         | Why rejected                                                                      |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| Store one commission rate on each booking      | Does not support effective-dated or product-specific rules.                       |
| Calculate payouts only when they are displayed | Results could change when commission rules change.                                |
| Store only a single company payout total       | Does not support agent-level statements.                                          |
| Store payout results by agent                  | Selected because agents and finance users require agent-level payout information. |

## References

- `commission_rules`
- `payout_runs`
- `payout_line_items`
- `payout_booking_items`
- Payout service implementation