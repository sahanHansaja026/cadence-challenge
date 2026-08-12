# ADR-0003: Refund Against a Finalised Payout Run

**Date:** 2026-08-12
**Status:** Accepted
**Decider:** Sahan Hansaja

## Context

The Cadence system needs to handle refunds.

A refund may occur after a payout run has already been finalised. Once a payout run is finalised, changing its original amount could make the payout history inaccurate.

The system therefore needs a way to record the refund without changing the already-finalised payout.

## Decision

We will not modify a finalised payout run when a refund occurs.

Instead, the refund will be recorded as an adjustment and applied to the sales representative's next eligible payout run.

The original finalised payout will remain unchanged.

## Consequences

### Positive

* Finalised payouts remain historically accurate.
* Refunds are still recorded and accounted for.
* The next payout can include the required deduction.
* The system has a clear audit trail for the refund.

### Negative / Trade-offs

* The refund may not affect the payout immediately.
* The next payout calculation becomes slightly more complex.
* The system needs to track outstanding refund adjustments.

## Alternatives Considered

| Option   | Why rejected |
| -------- | ------------ |
| Modify the finalised payout | Could change historical financial records after the payout has already been finalised.        |


## References

* `docs/reference/ADR_PROCESS.md`
