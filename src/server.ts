import "dotenv/config";

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import companyRoutes from "./routes/company.routes";
import userRoutes from "./routes/user.routes";
import agentRoutes from "./routes/agent.routes";
import bookingRoutes from "./routes/booking.routes";
import payoutRoutes from "./routes/payout.routes";
import bookingManagementRoutes from "./routes/booking-management.routes";
import commissionRuleRoutes from "./routes/commissionRule.routes";
import refundRoutes from "./routes/refund.routes";
import reportRoutes from "./routes/report.routes";
import passwordRoutes from "./routes/password.routes";


const app = express();
app.use(
    cors({
        origin: "http://localhost:5173",
    }),
);
app.use(express.json());
//get report
app.use(
    "/api/reports",
    reportRoutes,
);
// refound
//refund
app.use(
    "/api/refunds",
    refundRoutes,
);

// commiton rule
app.use(
    "/api/commission-rules",
    commissionRuleRoutes,
);
// Payout runs
// COMPANY_ADMIN + FINANCE
app.use(
    "/api/payout-runs",
    payoutRoutes,
);
//bokking
app.use(
    "/api/bookings",
    bookingRoutes,
);

app.use(
    "/api/bookings",
    bookingManagementRoutes,
);
// password change
app.use(
    "/api/password",
    passwordRoutes,
);
// agent assing
app.use(
    "/api/agents",
    agentRoutes,
);

// company admin create finace and agents
app.use(
    "/api/users",
    userRoutes,
);

// all users login her
app.use(
    "/api/auth",
    authRoutes,
);

// only create companyies by developer
app.use(
    "/api/companies",
    companyRoutes,
);

app.get(
    "/health",
    (_req, res) => {
        res.status(200).json({
            data: {
                status: "ok",
            },
        });
    },
);

const port =
    Number(process.env.PORT) || 3000;

app.listen(
    port,
    () => {
        console.log(
            `Server API running on port ${port}`,
        );
    },
);