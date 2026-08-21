import type {
    Request,
    Response,
} from "express";

import {
    createCompanySchema,
} from "../schemas/company.schema";

import {
    createCompany,
} from "../services/company.service";

export async function createCompanyController(
    req: Request,
    res: Response,
): Promise<void> {
    const parsed =
        createCompanySchema.safeParse(req.body);

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
        const company =
            await createCompany(parsed.data);

        res.status(201).json({
            data: {
                company,
            },
        });
    } catch (error: unknown) {
        if (
            error instanceof Error &&
            error.message ===
            "COMPANY_ALREADY_EXISTS"
        ) {
            res.status(409).json({
                error: {
                    code: "COMPANY_ALREADY_EXISTS",
                    message:
                        "A company with this ID already exists.",
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