import type {
    Request,
    Response,
} from "express";

import {
    loginSchema,
    signupSchema,
} from "../schemas/auth.schema";

import {
    login,
    signup,
} from "../services/auth.service";

export async function signupController(
    req: Request,
    res: Response,
): Promise<void> {
    const parsed = signupSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Invalid request data.",
                details: parsed.error.issues.map(
                    (issue) => ({
                        field: issue.path.join("."),
                        message: issue.message,
                    }),
                ),
            },
        });

        return;
    }

    try {
        const result = await signup(parsed.data);

        res.status(201).json({
            data: result,
        });
    } catch (error: unknown) {
        if (
            error instanceof Error &&
            error.message === "USER_ALREADY_EXISTS"
        ) {
            res.status(409).json({
                error: {
                    code: "USER_ALREADY_EXISTS",
                    message:
                        "A user with this email already exists.",
                },
            });

            return;
        }

        console.error(error);

        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Something went wrong.",
            },
        });
    }
}

export async function loginController(
    req: Request,
    res: Response,
): Promise<void> {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Invalid request data.",
                details: parsed.error.issues.map(
                    (issue) => ({
                        field: issue.path.join("."),
                        message: issue.message,
                    }),
                ),
            },
        });

        return;
    }

    try {
        const result = await login(parsed.data);

        res.status(200).json({
            data: result,
        });
    } catch (error: unknown) {
        if (
            error instanceof Error &&
            error.message === "INVALID_CREDENTIALS"
        ) {
            res.status(401).json({
                error: {
                    code: "INVALID_CREDENTIALS",
                    message:
                        "Invalid email or password.",
                },
            });

            return;
        }

        console.error(error);

        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Something went wrong.",
            },
        });
    }
}