# ADR-0007: Exchange Rate Data Model

**Date:** 2026-08-18
**Status:** Accepted
**Decider:** Sahan Hansaja

## Context

Cadence supports bookings in multiple currencies. Some clients are charged in USD, while Finance needs reporting in LKR using the exchange rate applicable on the booking date.

Exchange rates are provided by Finance through a spreadsheet that is updated weekly. The system therefore needs to store historical exchange rates so that the rate used for a booking can be determined consistently based on its booking date.

The exchange rate must not be hard-coded into the booking or payout logic because rates change over time and historical rates need to remain available.

## Decision

Create a dedicated `exchange_rates` table to store historical currency-to-LKR rates.

The table stores:

* `effective_from` — date from which the rate applies.
* `currency` — three-letter currency code such as `USD`.
* `rate_to_lkr` — exchange rate from the currency to LKR.
* `source` — source of the rate, such as `CBSL weekly`.
* `created_at` — timestamp when the rate was added.

A unique constraint is applied to `(effective_from, currency)` so that the same currency cannot have multiple rates for the same effective date.

The rate is considered applicable to a booking when:

```text
effective_from <= booking_date
```

The most recent applicable rate is selected.

For example, if a USD booking occurs on `2026-02-20`, the `2026-02-16` USD rate is used because it is the latest rate effective on or before the booking date.

LKR bookings do not require an exchange-rate lookup because their reporting currency is already LKR.

## Consequences

### Positive

* Historical exchange rates are preserved.
* Finance can update rates without changing application code.
* USD and other foreign-currency bookings can be converted to LKR using the correct historical rate.
* Duplicate rates for the same currency and effective date are prevented.
* The source of each rate is recorded for traceability.
* The exchange-rate lookup can be reused by booking, payout, and reporting services.

### Negative / Trade-offs

* Exchange rates must be maintained separately from bookings.
* A foreign-currency booking cannot be converted if no applicable exchange rate exists.
* Finance needs a process for importing or entering new rates.
* Changing a rate after it has been used could affect recalculation unless the applied rate is stored with the booking or payout record.

## Alternatives Considered

| Option                                                | Why rejected                                                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Store the exchange rate directly in the booking table | Couples booking records to rate-management data and makes maintaining the weekly rate history less clean.          |
| Hard-code exchange rates in the application           | Rates change regularly and historical rates cannot be maintained safely in application code.                       |
| Store only the latest exchange rate                   | Historical bookings would not be able to use the correct rate for their booking date.                              |
| Store exchange rates in a configuration file          | Finance would need developers to update rates, and the application would not have a proper historical audit trail. |

## References

* Finance-provided weekly exchange-rate export.
* `exchange_rates` database table.
* Related booking and reporting requirements.

---
