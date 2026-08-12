# ADR-0002: Prisma vs. Raw pg Driver

**Date:** 2026-08-12
**Status:** Accepted
**Decider:** Sahan Hansaja

## Context

The Cadence backend needs to communicate with PostgreSQL.

Two possible approaches were considered: Prisma ORM and the raw `pg` PostgreSQL driver.

The application contains several related entities, such as sales representatives, sales, commissions, and payout runs. Managing these relationships and database queries directly with SQL can require more manual code.

A decision is needed before implementing the database layer.

## Decision

We will use Prisma ORM for database access.

Prisma will be responsible for communicating with PostgreSQL and managing the application's database models and queries.

## Consequences

### Positive

- Provides a clear schema for the application's database models.
- Makes relationships between entities easier to work with.
- Provides type-safe database queries.
- Reduces the amount of raw SQL that needs to be written.
- Makes database migrations easier to manage.

### Negative / Trade-offs

- Adds Prisma as an additional dependency and abstraction layer.
- Developers need to learn Prisma's API and workflow.
- Some complex PostgreSQL queries may still require raw SQL.
- The application becomes more dependent on Prisma's tooling.

## Alternatives Considered

| Option   | Why rejected |
| -------- | ------------ |
| Raw pg driver | Requires more manual SQL and database handling for the application's related entities.        |


## References

* `docs/reference/ADR_PROCESS.md`
* Prisma documentation
