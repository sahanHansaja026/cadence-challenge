# Defect Report — `src/legacy/`

At least three defects, each with a concrete reproduction. "This is bad practice" is not
a defect. "Given input X the function returns Y and it should return Z" is.

---

## D1 — Missing company filter in agent booking lookup

**Location:** `src/legacy/bookingRepository.ts:55-68`

**Severity:** High security issue

**Reproduction:**

Create two companies that both have an agent with the code `AG001`.

Create one booking for each company using that agent code.

Call:

`findBookingsByAgentCode(pool, "company-a", "AG001")`.

The regression test is:

`src/legacy/test/bookingRepository.test.ts::should only return bookings belonging to the requested company`

The original implementation failed with:

`Expected: 1`

`Received: 2`

**Root cause:**

`findBookingsByAgentCode()` accepted `companyId`, but the original SQL query
only filtered by `agent_code`. The `companyId` was not included in the
`WHERE` clause, so bookings from other companies using the same agent code
could also be returned.

**Impact:**

A user requesting bookings for one company could receive booking data
belonging to another company. This broke tenant isolation and could expose
customer/booking information across companies.

**Fix:**

Updated the SQL query to filter by both `company_id` and `agent_code`:

```sql
WHERE company_id = $1
  AND agent_code = $2
  ```

---

## D2 — First pagination page skips records

**Location:** `src/legacy/pagination.ts:35-37`

**Severity:** Medium

**Reproduction:**

Call:

`toOffset({ page: 1, limit: 25 })`.

The original function returned `25`, but the first page should start at
offset `0`.

The regression test is:

`src/legacy/test/pagination.test.ts::should return offset 0 for the first page`

**Root cause:**

`toOffset()` originally multiplied the 1-based page number directly by the
page size:

```ts
page * limit
````
## D3 — CSV period filter uses incompatible date formats

**Location:** `src/legacy/csvPeriod.ts:24-26`

**Severity:** Medium

**Reproduction:**

Provide a CSV row with the date `03/04/2026` and filter it using the period
`2026-04-01` to `2026-04-30`.

The regression test is:

`src/legacy/test/csvPeriod.test.ts::should include a CSV row when its DD/MM/YYYY date is inside the period`

The original test failed with:

`Expected: 1`

`Received: 0`

**Root cause:**

The CSV import format uses `DD/MM/YYYY`, while `periodStart` and `periodEnd`
use ISO `YYYY-MM-DD`.

The original `filterCsvRowsByPeriod()` compared these strings directly:

```ts
row.date >= periodStart &&
row.date <= periodEnd
````

## D4 — Concurrent payout runs can receive the same run number

**Location:** `src/legacy/runNumber.ts:7-14`

**Severity:** High

**Reproduction:** Create two payout runs for the same company concurrently when the current maximum run number is 5. Both calls to `nextRunNumber()` can read `MAX(run_no) = 5` and calculate the next number as 6. Both payout runs are then created with `run_no = 6`.

The regression test is:

`src/legacy/test/runNumber.test.ts::should generate different run numbers for concurrent payout runs`

# Defect Report — `src/legacy/`

At least three defects, each with a concrete reproduction. "This is bad practice" is not
a defect. "Given input X the function returns Y and it should return Z" is.

---

## D5 — Missing company filter in agent booking lookup

**Location:** `src/legacy/bookingRepository.ts:55-68`

**Severity:** High security issue

**Reproduction:**

Create two companies that both have an agent with the code `AG001`.

Create one booking for each company using that agent code.

Call:

`findBookingsByAgentCode(pool, "company-a", "AG001")`.

The regression test is:

`src/legacy/test/bookingRepository.test.ts::should only return bookings belonging to the requested company`

The test currently fails with:

`Expected: 1`

`Received: 2`

**Root cause:**

`findBookingsByAgentCode()` accepts `companyId`, but the SQL query only filters by
`agent_code`. The `companyId` is not included in the `WHERE` clause, so the query can
return bookings from other companies that use the same agent code.

**Impact:**

A user requesting bookings for one company can receive booking data belonging to another
company. This breaks tenant isolation and can expose customer/booking information across
companies.

**Fix:**

Add the company ID to the SQL filter so that both the company and agent code must match:

```sql
WHERE company_id = $1
  AND agent_code = $2
````
## Anything you looked at and decided was *not* a defect

Worth writing down. Ruling something out deliberately is as much a signal as finding a
bug.

