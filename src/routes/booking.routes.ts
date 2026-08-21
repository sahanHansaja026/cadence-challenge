import { Router } from "express";

import {
    authenticate,
} from "../middleware/auth.middleware";

import {
    requireRole,
} from "../middleware/role.middleware";

import {
    uploadCsv,
} from "../middleware/upload.middleware";
import { importBookingsController } from "../controllers/booking.controller";



const router = Router();

/*
 * Finance Admin and Company Admin
 * can import bookings.
 */

router.post(
    "/import",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
    ),
    uploadCsv.single("file"),
    importBookingsController,
);

export default router;