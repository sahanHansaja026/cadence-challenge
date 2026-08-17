import { Router } from "express";

import {
    authenticate,
} from "../middleware/auth.middleware";

import {
    requireRole,
} from "../middleware/role.middleware";

import {
    getBookingsController,
    getBookingController,
    updateBookingController,
    rejectBookingController,
} from "../controllers/booking-management.controller";


const router = Router();


/*
 * =====================================================
 * VIEW BOOKINGS
 * =====================================================
 *
 * COMPANY_ADMIN → all company bookings
 * FINANCE       → all company bookings
 * AGENT         → own bookings only
 *
 * The controller determines the scope.
 */
router.get(
    "/",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
        "AGENT",
    ),
    getBookingsController,
);


/*
 * =====================================================
 * VIEW SINGLE BOOKING
 * =====================================================
 *
 * COMPANY_ADMIN → any booking in company
 * FINANCE       → any booking in company
 * AGENT         → only own booking
 */
router.get(
    "/:id",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
        "AGENT",
    ),
    getBookingController,
);


/*
 * =====================================================
 * EDIT BOOKING
 * =====================================================
 *
 * COMPANY_ADMIN → YES
 * FINANCE       → YES
 * AGENT         → NO
 */
router.patch(
    "/:id",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
    ),
    updateBookingController,
);


/*
 * =====================================================
 * REJECT BOOKING
 * =====================================================
 *
 * COMPANY_ADMIN → YES
 * FINANCE       → YES
 * AGENT         → NO
 */
router.post(
    "/:id/reject",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
    ),
    rejectBookingController,
);


export default router;