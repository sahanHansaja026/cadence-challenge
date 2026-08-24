import { Router } from "express";

import {
    loginController,
    signupController,
} from "../controllers/auth.controller";

import {
    authenticate,
} from "../middleware/auth.middleware";

const router = Router();

router.post(
    "/signup",
    signupController,
);

router.post(
    "/login",
    loginController,
);

router.get(
    "/me",
    authenticate,
    (req, res) => {
        res.status(200).json({
            data: {
                user: req.user,
            },
        });
    },
);

export default router;