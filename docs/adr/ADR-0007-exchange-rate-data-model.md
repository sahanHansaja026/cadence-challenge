# ADR-0007: Exchange Rate Data Model

**Date:** 2026-08-20

**Status:** Accepted

**Decider:** Sahan Hansaja

## Context

Cadence processes bookings that may be recorded in currencies other than
the company's reporting currency, LKR.

The existing `bookings` table stores:

- `amount`
- `currency`
- `original_amount`
- `original_currency`
- `exchange_rate`

Therefore, the system needs a reliable way to store exchange rates that were
effective on a particular date.

Exchange rates cannot be treated as a single global value because currency
rates can change over time. A booking processed on one date should use the
exchange rate applicable to that date rather than a newer rate.

The system also needs to retain the source of each exchange rate so that
finance users can understand where the rate originated.

Without a separate exchange-rate table, the application would have to either:

1. hard-code exchange rates,
2. overwrite the current rate and lose historical values, or
3. depend on an external exchange-rate service every time a booking or payout
   is processed.

These approaches make historical calculations less reliable and make it
difficult to reproduce previous payout calculations.

## Decision

Create a dedicated `exchange_rates` table to store historical exchange rates
used by the system.

The table contains:

- `id` - unique identifier for the exchange-rate record.
- `effective_from` - date from which the rate is applicable.
- `currency` - three-character ISO-style currency code.
- `rate_to_lkr` - conversion rate from the specified currency to LKR.
- `source` - source of the exchange rate.
- `created_at` - timestamp when the record was created.

The table uses the following structure:

```sql
CREATE TABLE exchange_rates (
    id text PRIMARY KEY,
    effective_from date NOT NULL,
    currency character(3) NOT NULL,
    rate_to_lkr numeric(14,4) NOT NULL,
    source text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,

    CONSTRAINT exchange_rates_positive_rate
        CHECK (rate_to_lkr > 0),

    CONSTRAINT exchange_rates_unique_date_currency
        UNIQUE (effective_from, currency)
);