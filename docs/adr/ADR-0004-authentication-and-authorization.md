# ADR-0004: JWT Authentication and Role-Based Authorization

**Date:** 2026-08-18  
**Status:** Accepted  
**Decider:** Sahan Hansaja

## Context

Cadence is a multi-tenant application with three user roles:

- `COMPANY_ADMIN`
- `FINANCE`
- `AGENT`

Different roles have different permissions. For example, company admins
can manage users, while agents should only access their own agent-specific
information.

The backend must also determine which company an authenticated request
belongs to.

## Decision

Use JWT-based authentication.

After successful login, the backend issues a JWT containing:

- User ID
- Company ID
- User role

Authenticated requests send the token using the HTTP `Authorization`
header with the `Bearer` scheme.

The authentication middleware validates the JWT and attaches the following
information to `req.user`:

- `userId`
- `companyId`
- `role`

Role-specific middleware is then used to restrict endpoints.

Company-specific database queries use the authenticated `companyId` rather
than accepting the company ID from the client request.

## Consequences

### Positive

- Authentication is stateless.
- The backend can identify the authenticated user and company.
- Role-based endpoint protection is explicit.
- Company isolation is easier to enforce.
- The frontend does not need to send the company ID for normal authenticated
  operations.

### Negative / Trade-offs

- JWTs must be stored and handled securely.
- Token expiration requires users to authenticate again unless a refresh
  mechanism is introduced.
- Authorization rules must be maintained as the application grows.
- The frontend authorization checks cannot replace backend authorization.

## Alternatives Considered

| Option                       | Why rejected                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| Session-based authentication | Adds server-side session state that is not required for this application.                 |
| Firebase Authentication      | The assignment backend already uses its own PostgreSQL user model and JWT authentication. |
| Frontend-only authorization  | Not secure because users can call backend endpoints directly.                             |

## References

- `src/middleware/auth.middleware.ts`
- `src/middleware/role.middleware.ts`
- `users` table