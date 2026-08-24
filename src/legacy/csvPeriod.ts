/**
 * Helpers for the import preview screen, which shows the operator how many rows in an
 * uploaded file fall inside the period they are importing.
 *
 * Rows here are raw CSV rows — nothing has been parsed or normalised yet. The partner
 * export writes dates as `DD/MM/YYYY`.
 */
export interface RawCsvRow {
  external_ref: string;
  agent_code: string;
  date: string;
  amount: string;
  product_code: string;
}

/**
 * Converts a partner CSV date from DD/MM/YYYY to ISO YYYY-MM-DD.
 */
function csvDateToIso(date: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;

  return `${year}-${month}-${day}`;
}

/**
 * @param periodStart ISO `YYYY-MM-DD`
 * @param periodEnd   ISO `YYYY-MM-DD`
 */
export function filterCsvRowsByPeriod(
  rows: RawCsvRow[],
  periodStart: string,
  periodEnd: string,
): RawCsvRow[] {
  return rows.filter((row) => {
    const rowDate = csvDateToIso(row.date);

    if (rowDate === null) {
      return false;
    }

    return (
      rowDate >= periodStart &&
      rowDate <= periodEnd
    );
  });
}

export function countRowsInPeriod(
  rows: RawCsvRow[],
  periodStart: string,
  periodEnd: string,
): number {
  return filterCsvRowsByPeriod(
    rows,
    periodStart,
    periodEnd,
  ).length;
}