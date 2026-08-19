import { Router } from "express";


import {
    authenticate,
} from "../middleware/auth.middleware";
import { changeOwnPasswordController } from "../controllers/admin.pasword.controller";


const router = Router();


// ============================================
// CHANGE OWN COMPANY ADMIN PASSWORD
// ============================================

router.patch(
    "/me/password",
    authenticate,
    changeOwnPasswordController,
);


export default router;