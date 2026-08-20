import type {
    Request,
    Response,
} from "express";

import {
    createUserSchema,
} from "../schemas/user.schema";

import {
    createUser,
    deleteUser,
    getUserById,
    getUsers,
    updateUser,
} from "../services/user.service";

export async function createUserController(
    req: Request,
    res: Response,
): Promise<void> {
    const parsed =
        createUserSchema.safeParse(req.body);

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

    try {
        const user = await createUser(
            parsed.data,
            req.user.companyId,
        );

        res.status(201).json({
            data: {
                user,
            },
        });
    } catch (error: unknown) {
        if (
            error instanceof Error &&
            error.message ===
            "USER_ALREADY_EXISTS"
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
                message:
                    "Something went wrong.",
            },
        });
    }
}

// GET ALL USERS

export async function getUsersController(
    req: Request,
    res: Response,
): Promise<void> {

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

    try {

        const users = await getUsers(
            req.user.companyId,
        );

        res.status(200).json({
            data: {
                users,
            },
        });

    } catch (error: unknown) {

        console.error(error);

        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message:
                    "Something went wrong.",
            },
        });
    }
}

export async function updateUserController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required.",
            },
        });

        return;
    }

    const userId = req.params.id;

    // TypeScript + request validation
    if (!userId || Array.isArray(userId)) {
        res.status(400).json({
            error: {
                code: "INVALID_USER_ID",
                message: "Invalid user ID.",
            },
        });

        return;
    }

    const {
        email,
        password,
        role,
    } = req.body;

    // Validate email
    if (
        typeof email !== "string" ||
        !email.includes("@")
    ) {
        res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Valid email is required.",
            },
        });

        return;
    }

    // Validate role
    if (
        role !== "FINANCE" &&
        role !== "AGENT"
    ) {
        res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message:
                    "Role must be FINANCE or AGENT.",
            },
        });

        return;
    }

    // Validate password if provided
    if (
        password !== undefined &&
        (
            typeof password !== "string" ||
            password.length < 8
        )
    ) {
        res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message:
                    "Password must be at least 8 characters.",
            },
        });

        return;
    }

    try {
        const user = await updateUser(
            userId,
            req.user.companyId,
            email,
            role,
            password,
        );

        res.status(200).json({
            data: {
                user,
            },
        });

    } catch (error: unknown) {

        if (
            error instanceof Error &&
            error.message === "USER_NOT_FOUND"
        ) {
            res.status(404).json({
                error: {
                    code: "USER_NOT_FOUND",
                    message: "User not found.",
                },
            });

            return;
        }

        if (
            error instanceof Error &&
            error.message ===
            "USER_ALREADY_EXISTS"
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

// delete 
export async function deleteUserController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required.",
            },
        });

        return;
    }

    const userId = req.params.id;

    // Validate ID
    if (!userId || Array.isArray(userId)) {
        res.status(400).json({
            error: {
                code: "INVALID_USER_ID",
                message: "Invalid user ID.",
            },
        });

        return;
    }

    try {
        await deleteUser(
            userId,
            req.user.companyId,
        );

        res.status(200).json({
            data: {
                message:
                    "User deleted successfully.",
            },
        });

    } catch (error: unknown) {

        if (
            error instanceof Error &&
            error.message === "USER_NOT_FOUND"
        ) {
            res.status(404).json({
                error: {
                    code: "USER_NOT_FOUND",
                    message: "User not found.",
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
// get user by id
// GET USER BY ID
export async function getUserByIdController(
    req: Request,
    res: Response,
): Promise<void> {

    if (!req.user) {
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required.",
            },
        });

        return;
    }

    const userId = req.params.id;

    if (!userId || Array.isArray(userId)) {
        res.status(400).json({
            error: {
                code: "INVALID_USER_ID",
                message: "Invalid user ID.",
            },
        });

        return;
    }

    try {
        const user = await getUserById(
            userId,
            req.user.companyId,
        );

        if (!user) {
            res.status(404).json({
                error: {
                    code: "USER_NOT_FOUND",
                    message: "User not found.",
                },
            });

            return;
        }

        // Do not return password_hash
        res.status(200).json({
            data: {
                user,
            },
        });

    } catch (error: unknown) {

        console.error(error);

        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Something went wrong.",
            },
        });
    }
}