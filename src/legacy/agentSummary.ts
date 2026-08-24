import type { Pool } from "pg";

import {
  findBookingsByAgentCode,
  type BookingRecord,
} from "./bookingRepository";


export interface AgentSummary {
  agentCode: string;
  bookingCount: number;
  gross: number;
  commission: number;
}


/**
 * Round a number to two decimal places.
 */
function round2(
  value: number,
): number {

  return Math.round(
    (value + Number.EPSILON) * 100,
  ) / 100;
}


/**
 * Validate an ISO date.
 */
function isValidIsoDate(
  value: string,
): boolean {

  return /^\d{4}-\d{2}-\d{2}$/.test(
    value,
  );
}


/**
 * Totals one agent's bookings for a period
 * and applies a flat commission rate.
 *
 * periodStart / periodEnd:
 * YYYY-MM-DD
 *
 * rate:
 * Decimal value such as:
 * 0.05 = 5%
 */
export function summariseAgent(
  agentCode: string,
  bookings: BookingRecord[],
  rate: number,
  periodStart: string,
  periodEnd: string,
): AgentSummary {

  if (!agentCode.trim()) {

    throw new Error(
      "Agent code is required.",
    );

  }


  if (
    !isValidIsoDate(periodStart) ||
    !isValidIsoDate(periodEnd)
  ) {

    throw new Error(
      "Period dates must use YYYY-MM-DD format.",
    );

  }


  if (periodStart > periodEnd) {

    throw new Error(
      "Period start date cannot be after period end date.",
    );

  }


  if (
    !Number.isFinite(rate) ||
    rate < 0
  ) {

    throw new Error(
      "Commission rate must be a valid non-negative number.",
    );

  }


  const inPeriod =
    bookings.filter(
      (booking) =>
        booking.agent_code === agentCode &&
        booking.booking_date >= periodStart &&
        booking.booking_date <= periodEnd,
    );


  let gross = 0;


  for (const booking of inPeriod) {

    const amount =
      Number(booking.amount);


    if (!Number.isFinite(amount)) {

      throw new Error(
        `Invalid booking amount for booking ${booking.id}.`,
      );

    }


    gross += amount;

  }


  const roundedGross =
    round2(gross);


  const commission =
    round2(
      roundedGross * rate,
    );


  return {
    agentCode,
    bookingCount: inPeriod.length,
    gross: roundedGross,
    commission,
  };
}


/**
 * Loads an agent's bookings for the requested company
 * and creates the agent summary for the requested period.
 *
 * The companyId is passed to findBookingsByAgentCode()
 * to maintain tenant isolation.
 */
export async function buildAgentSummary(
  pool: Pool,
  companyId: string,
  agentCode: string,
  rate: number,
  periodStart: string,
  periodEnd: string,
): Promise<AgentSummary> {

  if (!companyId.trim()) {

    throw new Error(
      "Company ID is required.",
    );

  }


  const bookings =
    await findBookingsByAgentCode(
      pool,
      companyId,
      agentCode,
    );


  return summariseAgent(
    agentCode,
    bookings,
    rate,
    periodStart,
    periodEnd,
  );
}