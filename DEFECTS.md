# Defect Report — `src/legacy/`

At least three defects, each with a concrete reproduction. "This is bad practice" is not
a defect. "Given input X the function returns Y and it should return Z" is.

---

## D1 — Missing company filter in agent booking lookup ---

**Location:** `src/legacy/bookingRepository.ts:55-68`

**Severity:** High security issue

**Reproduction:**
Create two companies that both have an agent with the code `AG001`.
Create one booking for each company using that agent code.

Call `findBookingsByAgentCode(pool, "company-a", "AG001")`.

The regression test is:
`src/legacy/test/bookingRepository.test.ts::should only return bookings belonging to the requested company`

The test currently fails with:

`Expected: 1`
`Received: 2`

**Root cause:**
`findBookingsByAgentCode()` accepts `companyId`, but the SQL query only filters by `agent_code`. The `companyId` is not included in the `WHERE` clause, so the query can return bookings from other companies that use the same agent code.

**Impact:**
A user requesting bookings for one company can receive booking data belonging to another company. This breaks tenant isolation and can expose customer/booking information across companies.

**Fix:**


**Regression test:**


---

## D2 — First pagination page skips records ---

**Location:** `src/legacy/pagination.ts:35-37`

**Severity:** Medium

**Reproduction:** Call `toOffset({ page: 1, limit: 25 })`. The function returns `25`, but the first page should start at offset `0`. The regression test is `src/legacy/test/pagination.test.ts::should return offset 0 for the first page`.

**Root cause:** `toOffset()` multiplies the 1-based page number directly by the page size. Because page numbering starts at 1, the calculation should subtract 1 before multiplying by the limit.

**Impact:** The first 25 records are skipped when requesting page 1. This causes users to miss the first page of booking results and shifts all subsequent pagination offsets.

**Fix:** 
**Regression test:** `
## D3 — CSV period filter uses incompatible date formats

**Location:** `src/legacy/csvPeriod.ts:24-26`

**Severity:** Medium

**Reproduction:** Provide a CSV row with the date `03/04/2026` and filter it using the period `2026-04-01` to `2026-04-30`. The regression test is `src/legacy/test/csvPeriod.test.ts::should include a CSV row when its DD/MM/YYYY date is inside the period`.

The test currently fails with:

`Expected: 1`
`Received: 0`

**Root cause:** The CSV import format uses `DD/MM/YYYY`, while `periodStart` and `periodEnd` use ISO `YYYY-MM-DD`. `filterCsvRowsByPeriod()` compares these strings directly instead of converting the CSV date to the same format before comparison.

**Impact:** Valid CSV booking rows can be excluded from the import preview when their dates fall within the requested period. This can cause the displayed booking count to be incorrect and may cause valid bookings to be missed during import processing.

**Fix:** 

**Regression test:** 

## D4 — Concurrent payout runs can receive the same run number

**Location:** `src/legacy/runNumber.ts:7-14`

**Severity:** High

**Reproduction:** Create two payout runs for the same company concurrently when the current maximum run number is 5. Both calls to `nextRunNumber()` can read `MAX(run_no) = 5` and calculate the next number as 6. Both payout runs are then created with `run_no = 6`.

The regression test is:
`src/legacy/test/runNumber.test.ts::should generate different run numbers for concurrent payout runs`

The test currently fails with:

`Expected: not 6`

`Received: 6`

**Root cause:** `nextRunNumber()` calculates the next number using `MAX(run_no) + 1` in a separate query before the payout run is inserted. Concurrent requests can read the same maximum value before either insert occurs, causing both requests to generate the same run number.

**Impact:** Two payout runs belonging to the same company can receive the same run number. Since run numbers are used to identify payout runs and appear on payslips, duplicate numbers can cause ambiguity and incorrect payout identification.

**Fix:** 

**Regression test:** 

## Anything you looked at and decided was *not* a defect

Worth writing down. Ruling something out deliberately is as much a signal as finding a
bug.

