import type {
    NextFunction,
    Request,
    Response,
} from "express";

import type {
    UserRole,
} from "../services/auth.service";

export function requireRole(
    ...allowedRoles: UserRole[]
) {
    return (
        req: Request,
        res: Response,
        next: NextFunction,
    ): void => {
        if (!req.user) {
            res.status(401).json({
                error: {
                    code: "UNAUTHORIZED",
                    message:
                        "Authentication required.",
                },
            });

            return;
        }

        if (
            !allowedRoles.includes(req.user.role)
        ) {
            res.status(403).json({
                error: {
                    code: "FORBIDDEN",
                    message:
                        "You do not have permission to perform this action.",
                },
            });

            return;
        }

        next();
    };
}