# ADR-0001: Data Model

**Date:** 2026-08-12
**Status:** Proposed 
**Decider:** Sahan Hansaja

## Context
The Cadence system needs to store information about sales, commissions, sales representatives, and payout runs.

A clear data structure is needed so that these records can be related and managed separately.

## Decision
We will use a relational data model with separate entities for sales representatives, sales, commissions, and payout runs.
## Consequences
### Positive
- Data will be organized into clear entities.
- Relationships between sales, commissions, and payouts will be easier to manage.
- The model can be extended in the future.
 ...

### Negative / Trade-offs
- More tables and relationships need to be managed.
- The database structure is more complex than using one table.
    ...

## Alternatives Considered

| Option   | Why rejected |
| -------- | ------------ |
| One large table | Would create duplicated and difficult-to-manage data. |
| Separate related entities | Chosen because the data has clear relationships.       |