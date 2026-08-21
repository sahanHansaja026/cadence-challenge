import { Router } from "express";

import {
    createCompanyController,
} from "../controllers/company.controller";

const router = Router();

router.post(
    "/",
    createCompanyController,
);

export default router;