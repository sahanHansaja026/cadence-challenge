# Clarification Log

Every question you ask, the answer you got, and every assumption you made to unblock
yourself. Keep it current — a log written on Friday is worth nothing.

Status values: `OPEN` (asked, waiting), `ANSWERED`, `ASSUMED` (blocked, proceeded on my
own assumption).

---

## Q1 — Git branching strategy for continuing work

**Date asked:** 2026-08-13  
**Status:** OPEN  

**Question:**  
I have completed the authentication and authorization implementation in a separate branch and committed the changes.

For example:

- Day 1: Create `feature/auth-authorization`
- Complete authentication and authorization
- Commit and push the changes
- Day 2: Start working on the Agent Dashboard

If I create a new branch from `dev`, the new branch will not contain the authentication and authorization changes unless the previous branch has already been merged into `dev`.

Could you please advise which approach we should follow?

1. Merge the completed authentication/authorization branch into `dev`, then create the new feature branch from `dev`.
2. Create the new feature branch directly from the previous feature branch.
3. Continue using the same feature branch.

**Why it matters / what it blocks:**  
I need to determine the correct branching workflow before starting the next feature so that the authentication and authorization work is preserved while keeping each feature in a separate branch.

**Answer:**  
Waiting for mentor/team guidance.

**Assumption made while waiting:**  
Until I receive guidance, I will keep the completed authentication and authorization work in its current feature branch and avoid creating the next feature branch based on an outdated `dev` branch.

If I need to continue development that depends on the authentication and authorization implementation before the branch is merged, I will create the new branch from the completed authentication/authorization branch.

**What I would have to change if the answer contradicts my assumption:**  
If the team requires every new feature branch to be created only from `dev`, I will merge the completed authentication/authorization branch into `dev` first and create subsequent feature branches from the updated `dev`.

If the team follows another branching strategy, I will adjust the branch structure accordingly.


## Q2 — ...
