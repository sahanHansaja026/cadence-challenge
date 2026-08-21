# ADR-0002: Prisma vs. Raw pg Driver

**Date:** 2026-08-12  
**Status:** Accepted  
**Decider:** Sahan Hansaja

## Context

The Cadence backend needs to communicate with PostgreSQL.

Two possible approaches were considered: Prisma ORM and the raw `pg`
PostgreSQL driver.

The application contains several related entities, including companies,
users, agents, bookings, commission rules, refunds, and payout runs.

A database access approach is required that provides sufficient control
over PostgreSQL queries while keeping the backend implementation simple
for the scope of the assignment.

## Decision

We will use the raw `pg` PostgreSQL driver for database access.

The application will use PostgreSQL directly through the Node.js `pg`
package and a shared database query helper.

SQL queries will be kept inside the service/database layer rather than
being placed directly inside controllers.

## Consequences

### Positive

- Gives direct control over PostgreSQL queries.
- Keeps the database layer lightweight.
- No ORM abstraction is required.
- PostgreSQL-specific features can be used directly.
- Queries are explicit and easy to inspect.
- Reduces additional tooling and dependencies.

### Negative / Trade-offs

- More SQL must be written manually.
- Database relationships and joins must be handled explicitly.
- Type safety for query results must be maintained manually.
- Database migrations need to be managed separately.
- More responsibility is placed on developers to write safe and
  efficient SQL queries.

## Alternatives Considered

| Option     | Why rejected                                                                                                                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma ORM | Adds an additional ORM abstraction that is not necessary for the current scope. The application requires direct PostgreSQL queries and the team is comfortable managing SQL through the `pg` driver. |

## Implementation

The backend uses the Node.js `pg` package with a shared connection pool.


