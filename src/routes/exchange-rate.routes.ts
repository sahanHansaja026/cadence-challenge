import {
    Router,
} from "express";

import {
    createExchangeRateController,
    getExchangeRatesController,
} from "../controllers/exchange-rate.controller";

const router = Router();

router.post(
    "/",
    createExchangeRateController,
);

router.get(
    "/",
    getExchangeRatesController,
);

export default router;