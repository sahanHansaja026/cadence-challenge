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


## Q2 — Handling changes that span multiple feature branches

**Date asked:** 2026-08-18  
**Status:** OPEN  

**Question:**  
Some features need to be connected across different backend modules.

For example:

- The Booking backend is implemented in one feature/branch.
- The Payout Run backend is implemented in another feature/branch.
- The Payout Run functionality needs booking data to calculate payouts.
- To connect both features correctly, some changes may be required in the Booking backend.

I am currently working on the Payout Run branch. If I need to modify Booking backend code to integrate it with Payout Run, should I:

1. Make the required Booking changes directly in the current Payout Run branch?
2. Switch to the Booking branch, make and commit the Booking changes there, then merge/cherry-pick those changes into the Payout Run branch?
3. Create a separate integration branch containing the changes from both features?
4. Wait until the Booking feature is merged into `dev`, then update the Payout Run branch from `dev`?

**Why it matters / what it blocks:**  
I need to know where cross-feature changes should be made so that the Booking and Payout Run implementations remain properly separated while still allowing the two features to work together.

**Answer:**  
Waiting for mentor/team guidance.

**Assumption made while waiting:**  
Until I receive guidance, I will avoid making unrelated Booking changes directly in the Payout Run branch. If a Booking change is required for the Payout Run integration, I will identify the required change and keep the integration change isolated so it can be moved to the appropriate branch later.

**What I would have to change if the answer contradicts my assumption:**  
If the team allows related changes to be made directly in the current feature branch, I will make the required Booking changes there.

If the team requires each feature's changes to remain in its own branch, I will move the Booking-specific changes to the Booking branch and merge or cherry-pick them into the Payout Run branch according to the team's preferred workflow.

## Q3 — Initial Company Admin account and credentials

**Date asked:** 2026-08-18  
**Status:** OPEN  

**Question:**  
For Company Admin registration, should the developer create an initial
Company Admin account with a default email and password?

After the Company Admin logs in for the first time, should the admin be
allowed to change their own email/password?

For example:

- Developer creates the company and initial `COMPANY_ADMIN` account.
- Developer provides the initial login credentials to the admin.
- Company Admin logs in using those credentials.
- Company Admin changes the default password and, if required, email.
- After that, the developer no longer needs to use the admin credentials.

**Why it matters / what it blocks:**  
I need to determine how the initial Company Admin account should be created
and how access should be transferred securely from the developer to the
Company Admin.

**Answer:**  
Waiting for mentor/team guidance.

**Assumption made while waiting:**  
Until I receive guidance, I will assume that the developer creates the
initial Company Admin account and that the Company Admin can change their
own password after the first login.

**What I would have to change if the answer contradicts my assumption:**  
If the team requires a different registration or credential-management
process, I will change the authentication and user-management flow
accordingly.