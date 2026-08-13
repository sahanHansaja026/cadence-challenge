import "dotenv/config";

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import companyRoutes from "./routes/company.routes";
import userRoutes from "./routes/user.routes";

const app = express();
app.use(
    cors({
        origin: "http://localhost:5173",
    }),
);
app.use(express.json());

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
            `Cadence API running on port ${port}`,
        );
    },
);