import type {
    NextFunction,
    Request,
    Response,
} from "express";

import jwt from "jsonwebtoken";

import type {
    UserRole,
} from "../services/auth.service";

export type AuthenticatedUser = {
    userId: string;
    companyId: string;
    role: UserRole;
};

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const authorization =
        req.headers.authorization;

    if (!authorization) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message:
                    "Authentication required.",
            },
        });

        return;
    }

    const [scheme, token] =
        authorization.split(" ");

    if (
        scheme !== "Bearer" ||
        !token
    ) {
        res.status(401).json({
            error: {
                code: "INVALID_AUTH_HEADER",
                message:
                    "Authorization header must use Bearer token.",
            },
        });

        return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        res.status(500).json({
            error: {
                code: "SERVER_CONFIGURATION_ERROR",
                message:
                    "JWT secret is not configured.",
            },
        });

        return;
    }

    try {
        const payload = jwt.verify(
            token,
            secret,
        );

        if (
            typeof payload !== "object" ||
            payload === null ||
            typeof payload.sub !== "string" ||
            typeof payload.companyId !== "string" ||
            !isValidRole(payload.role)
        ) {
            res.status(401).json({
                error: {
                    code: "INVALID_TOKEN",
                    message:
                        "Invalid authentication token.",
                },
            });

            return;
        }

        req.user = {
            userId: payload.sub,
            companyId: payload.companyId,
            role: payload.role,
        };

        next();
    } catch {
        res.status(401).json({
            error: {
                code: "INVALID_TOKEN",
                message:
                    "Invalid or expired authentication token.",
            },
        });
    }
}

function isValidRole(
    value: unknown,
): value is UserRole {
    return (
        value === "COMPANY_ADMIN" ||
        value === "FINANCE" ||
        value === "AGENT"
    );
}