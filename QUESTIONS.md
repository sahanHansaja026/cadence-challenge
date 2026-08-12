# Clarification Log

Every question you ask, the answer you got, and every assumption you made to unblock
yourself. Keep it current — a log written on Friday is worth nothing.

Status values: `OPEN` (asked, waiting), `ANSWERED`, `ASSUMED` (blocked, proceeded on my
own assumption).

---

## Q1 —  User registration and role assignment

**Date asked:** 2026-08-12
**Status:** OPEN
**Question:** 
The assignment defines three roles: COMPANY_ADMIN, FINANCE, and AGENT, but it does not specify how the initial company and COMPANY_ADMIN user should be created.

1. Should we implement a public signup/registration page, or should the initial company and COMPANY_ADMIN users be seeded?

2. Should COMPANY_ADMIN be able to create and assign FINANCE and AGENT users within their company?

3. If a signup page is required, should users be allowed to choose their role, or should roles always be assigned server-side?

Thanks.
**Why it matters / what it blocks:** ...
**Answer:** ...
**Assumption made while waiting:** 
I will assume that initial companies and users are seeded and that roles are assigned server-side. I will not allow users to select their own role from the frontend.(the company admins canot see other company details so) without that my dicision was crate developer admin and main admin can add company admins then company admins can haddle other users.
**What I would have to change if the answer contradicts my assumption:** 
If public signup is required, I will add the registration endpoint and frontend registration page. If COMPANY_ADMIN user management is required, I will add the appropriate user-management API and UI.


## Q2 — ...
