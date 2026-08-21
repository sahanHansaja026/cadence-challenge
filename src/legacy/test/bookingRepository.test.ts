import {
    describe,
    expect,
    it,
    vi,
} from "vitest";

import {
    findBookingsByAgentCode,
} from "../correct/bookingRepository";


describe(
    "findBookingsByAgentCode",
    () => {

        it(
            "should only return bookings belonging to the requested company",
            async () => {

                const bookings = [
                    {
                        id: "booking-a",
                        company_id: "company-a",
                        external_ref: "A-001",
                        agent_code: "AG001",
                        booking_date: "2026-04-03",
                        amount: "100.00",
                        product_code: "P001",
                    },

                    {
                        id: "booking-b",
                        company_id: "company-b",
                        external_ref: "B-001",
                        agent_code: "AG001",
                        booking_date: "2026-04-04",
                        amount: "200.00",
                        product_code: "P001",
                    },
                ];


                const query =
                    vi.fn().mockImplementation(
                        async (
                            _sql: string,
                            params: string[],
                        ) => {

                            const [
                                companyId,
                                agentCode,
                            ] = params;


                            const rows =
                                bookings.filter(
                                    (booking) =>
                                        booking.company_id ===
                                        companyId &&
                                        booking.agent_code ===
                                        agentCode,
                                );


                            return {
                                rows,
                            };
                        },
                    );


                const pool = {
                    query,
                } as any;


                const result =
                    await findBookingsByAgentCode(
                        pool,
                        "company-a",
                        "AG001",
                    );


                /*
                 * Only company-a booking should
                 * be returned.
                 */

                expect(
                    result,
                ).toHaveLength(1);


                expect(
                    result[0]?.id,
                ).toBe("booking-a");


                expect(
                    result[0]?.agent_code,
                ).toBe("AG001");


                /*
                 * Verify the repository sends
                 * company_id and agent_code.
                 */

                expect(
                    query,
                ).toHaveBeenCalledWith(
                    expect.stringContaining(
                        "company_id",
                    ),
                    [
                        "company-a",
                        "AG001",
                    ],
                );


                expect(
                    query,
                ).toHaveBeenCalledWith(
                    expect.stringContaining(
                        "agent_code = $2",
                    ),
                    [
                        "company-a",
                        "AG001",
                    ],
                );
            },
        );
    },
);