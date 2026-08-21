import { Router } from "express";

import {
    createUserController,
    deleteUserController,
    getUserByIdController,
    getUsersController,
    updateUserController,
} from "../controllers/user.controller";

import {
    authenticate,
} from "../middleware/auth.middleware";

import {
    requireRole,
} from "../middleware/role.middleware";

const router = Router();

router.post(
    "/",
    authenticate,
    requireRole("COMPANY_ADMIN"),
    createUserController,
);

router.get(
    "/",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
        "FINANCE",
    ),
    getUsersController,
);

// UPDATE USER
// Admin only
router.put(
    "/:id",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
    ),
    updateUserController,
);


// DELETE USER
// Admin only
router.delete(
    "/:id",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
    ),
    deleteUserController,
);
//get user by id
router.get(
    "/:id",
    authenticate,
    requireRole(
        "COMPANY_ADMIN",
    ),
    getUserByIdController,
);

export default router;