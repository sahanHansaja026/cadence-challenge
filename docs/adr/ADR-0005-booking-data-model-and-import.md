# ADR-0005: Company-Scoped Booking Storage and Import

**Date:** 2026-08-18  
**Status:** Accepted  
**Decider:** Sahan Hansaja

## Context

Bookings are imported into Cadence and later used by commission and payout
processing.

Each booking belongs to a company and an agent.

The same external booking reference may exist in different companies, but
should not be duplicated within the same company.

Imported booking data must also be validated before it is persisted.

## Decision

Store bookings in the `bookings` table with:

- `company_id`
- `external_ref`
- `agent_code`
- `booking_date`
- `amount`
- `currency`
- `product_code`
- `status`

The combination of `company_id` and `external_ref` is unique.

The authenticated user's company determines the company associated with
an imported booking rather than trusting a company ID supplied by the CSV
file.

Bookings are validated before insertion.

## Consequences

### Positive

- Bookings are isolated by company.
- Duplicate external references within a company are prevented.
- Imported booking data can be used directly by payout processing.
- The company ID cannot be changed by a normal importer request.

### Negative / Trade-offs

- Import processing must validate every row.
- Large CSV imports require multiple database operations.
- Invalid rows need to be reported back to the user.

## Alternatives Considered

| Option                                        | Why rejected                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| Accept `company_id` from the CSV              | Allows the imported data to specify a different tenant.                    |
| Use `external_ref` as a globally unique value | The same external reference can legitimately exist in different companies. |
| Insert rows without validation                | Could introduce invalid financial data into payout calculations.           |

## References

- `bookings` table
- Booking import implementation
- Payout processing