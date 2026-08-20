import type {
    Request,
    Response,
} from "express";

import {
    createCommissionRuleSchema,
    updateCommissionRuleSchema,
} from "../schemas/commissionRule.schema";

import {
    getCommissionRules,
    getCommissionRuleById,
    createCommissionRule,
    updateCommissionRule,
    deleteCommissionRule,
} from "../services/commissionRule.service";


/*
 * GET /api/commission-rules
 *
 * COMPANY_ADMIN / FINANCE
 */
export async function getCommissionRulesController(
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
        const rules =
            await getCommissionRules(
                req.user.companyId,
            );

        res.status(200).json({
            data: {
                rules,
            },
        });

    } catch (error: unknown) {

        console.error(
            "Get commission rules error:",
            error,
        );

        res.status(500).json({
            error: {
                code:
                    "COMMISSION_RULES_FETCH_FAILED",
                message:
                    "Failed to load commission rules.",
            },
        });
    }
}


/*
 * GET /api/commission-rules/:id
 *
 * COMPANY_ADMIN / FINANCE
 */
export async function getCommissionRuleController(
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

    const ruleId =
        req.params.id;

    if (
        typeof ruleId !== "string" ||
        !ruleId
    ) {
        res.status(400).json({
            error: {
                code:
                    "RULE_ID_REQUIRED",
                message:
                    "Commission rule ID is required.",
            },
        });

        return;
    }

    try {

        const rule =
            await getCommissionRuleById(
                req.user.companyId,
                ruleId,
            );

        if (!rule) {
            res.status(404).json({
                error: {
                    code:
                        "COMMISSION_RULE_NOT_FOUND",
                    message:
                        "Commission rule not found.",
                },
            });

            return;
        }

        res.status(200).json({
            data: {
                rule,
            },
        });

    } catch (error: unknown) {

        console.error(
            "Get commission rule error:",
            error,
        );

        res.status(500).json({
            error: {
                code:
                    "COMMISSION_RULE_FETCH_FAILED",
                message:
                    "Failed to load commission rule.",
            },
        });
    }
}


/*
 * POST /api/commission-rules
 *
 * COMPANY_ADMIN only.
 */
export async function createCommissionRuleController(
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

    /*
     * Defense-in-depth authorization.
     *
     * Route middleware also protects this endpoint.
     */
    if (
        req.user.role !== "COMPANY_ADMIN"
    ) {
        res.status(403).json({
            error: {
                code: "FORBIDDEN",
                message:
                    "Only company admins can create commission rules.",
            },
        });

        return;
    }

    try {

        const parsed =
            createCommissionRuleSchema.safeParse(
                req.body,
            );

        if (!parsed.success) {
            res.status(400).json({
                error: {
                    code:
                        "VALIDATION_ERROR",
                    message:
                        "Invalid commission rule data.",
                    details:
                        parsed.error.flatten(),
                },
            });

            return;
        }

        const rule =
            await createCommissionRule(
                req.user.companyId,
                parsed.data,
            );

        res.status(201).json({
            data: {
                rule,
            },
        });

    } catch (error: unknown) {

        if (
            error instanceof Error &&
            error.message ===
            "PRODUCT_CODE_REQUIRED"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "PRODUCT_CODE_REQUIRED",
                    message:
                        "Product code is required for a product override rule.",
                },
            });

            return;
        }

        if (
            error instanceof Error &&
            error.message ===
            "PRODUCT_CODE_NOT_ALLOWED_FOR_TIERED_RULE"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "PRODUCT_CODE_NOT_ALLOWED_FOR_TIERED_RULE",
                    message:
                        "Product code cannot be used with a tiered rule.",
                },
            });

            return;
        }

        if (
            error instanceof Error &&
            error.message ===
            "INVALID_MIN_AMOUNT"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "INVALID_MIN_AMOUNT",
                    message:
                        "Minimum amount must be zero or greater.",
                },
            });

            return;
        }

        if (
            error instanceof Error &&
            error.message ===
            "INVALID_AMOUNT_RANGE"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "INVALID_AMOUNT_RANGE",
                    message:
                        "Maximum amount must be greater than or equal to minimum amount.",
                },
            });

            return;
        }

        if (
            error instanceof Error &&
            error.message ===
            "INVALID_COMMISSION_RATE"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "INVALID_COMMISSION_RATE",
                    message:
                        "Commission rate must be between 0 and 100.",
                },
            });

            return;
        }

        if (
            error instanceof Error &&
            error.message ===
            "INVALID_EFFECTIVE_DATE_RANGE"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "INVALID_EFFECTIVE_DATE_RANGE",
                    message:
                        "Effective end date cannot be before the start date.",
                },
            });

            return;
        }

        if (
            error instanceof Error &&
            error.message ===
            "COMMISSION_RULE_OVERLAP"
        ) {
            res.status(409).json({
                error: {
                    code:
                        "COMMISSION_RULE_OVERLAP",
                    message:
                        "Another commission rule overlaps this effective date and amount range.",
                },
            });

            return;
        }

        console.error(
            "Create commission rule error:",
            error,
        );

        res.status(500).json({
            error: {
                code:
                    "COMMISSION_RULE_CREATE_FAILED",
                message:
                    "Failed to create commission rule.",
            },
        });
    }
}


/*
 * PATCH /api/commission-rules/:id
 *
 * COMPANY_ADMIN only.
 */
export async function updateCommissionRuleController(
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

    /*
     * Defense-in-depth authorization.
     */
    if (
        req.user.role !== "COMPANY_ADMIN"
    ) {
        res.status(403).json({
            error: {
                code: "FORBIDDEN",
                message:
                    "Only company admins can update commission rules.",
            },
        });

        return;
    }

    const ruleId =
        req.params.id;

    if (
        typeof ruleId !== "string" ||
        !ruleId
    ) {
        res.status(400).json({
            error: {
                code:
                    "RULE_ID_REQUIRED",
                message:
                    "Commission rule ID is required.",
            },
        });

        return;
    }

    try {

        const parsed =
            updateCommissionRuleSchema.safeParse(
                req.body,
            );

        if (!parsed.success) {
            res.status(400).json({
                error: {
                    code:
                        "VALIDATION_ERROR",
                    message:
                        "Invalid commission rule data.",
                    details:
                        parsed.error.flatten(),
                },
            });

            return;
        }

        const rule =
            await updateCommissionRule(
                req.user.companyId,
                ruleId,
                parsed.data,
            );

        if (!rule) {
            res.status(404).json({
                error: {
                    code:
                        "COMMISSION_RULE_NOT_FOUND",
                    message:
                        "Commission rule not found.",
                },
            });

            return;
        }

        res.status(200).json({
            data: {
                rule,
            },
        });

    } catch (error: unknown) {

        if (
            error instanceof Error &&
            error.message ===
            "PRODUCT_CODE_REQUIRED"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "PRODUCT_CODE_REQUIRED",
                    message:
                        "Product code is required for a product override rule.",
                },
            });

            return;
        }

        if (
            error instanceof Error &&
            error.message ===
            "PRODUCT_CODE_NOT_ALLOWED_FOR_TIERED_RULE"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "PRODUCT_CODE_NOT_ALLOWED_FOR_TIERED_RULE",
                    message:
                        "Product code cannot be used with a tiered rule.",
                },
            });

            return;
        }

        if (
            error instanceof Error &&
            error.message ===
            "INVALID_MIN_AMOUNT"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "INVALID_MIN_AMOUNT",
                    message:
                        "Minimum amount must be zero or greater.",
                },
            });

            return;
        }

        if (
            error instanceof Error &&
            error.message ===
            "INVALID_AMOUNT_RANGE"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "INVALID_AMOUNT_RANGE",
                    message:
                        "Maximum amount must be greater than or equal to minimum amount.",
                },
            });

            return;
        }

        if (
            error instanceof Error &&
            error.message ===
            "INVALID_COMMISSION_RATE"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "INVALID_COMMISSION_RATE",
                    message:
                        "Commission rate must be between 0 and 100.",
                },
            });

            return;
        }

        if (
            error instanceof Error &&
            error.message ===
            "INVALID_EFFECTIVE_DATE_RANGE"
        ) {
            res.status(400).json({
                error: {
                    code:
                        "INVALID_EFFECTIVE_DATE_RANGE",
                    message:
                        "Effective end date cannot be before the start date.",
                },
            });

            return;
        }

        if (
            error instanceof Error &&
            error.message ===
            "COMMISSION_RULE_OVERLAP"
        ) {
            res.status(409).json({
                error: {
                    code:
                        "COMMISSION_RULE_OVERLAP",
                    message:
                        "Another commission rule overlaps this effective date and amount range.",
                },
            });

            return;
        }

        console.error(
            "Update commission rule error:",
            error,
        );

        res.status(500).json({
            error: {
                code:
                    "COMMISSION_RULE_UPDATE_FAILED",
                message:
                    "Failed to update commission rule.",
            },
        });
    }
}


/*
 * DELETE /api/commission-rules/:id
 *
 * COMPANY_ADMIN only.
 */
export async function deleteCommissionRuleController(
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

    /*
     * Defense-in-depth authorization.
     */
    if (
        req.user.role !== "COMPANY_ADMIN"
    ) {
        res.status(403).json({
            error: {
                code: "FORBIDDEN",
                message:
                    "Only company admins can delete commission rules.",
            },
        });

        return;
    }

    const ruleId =
        req.params.id;

    if (
        typeof ruleId !== "string" ||
        !ruleId
    ) {
        res.status(400).json({
            error: {
                code:
                    "RULE_ID_REQUIRED",
                message:
                    "Commission rule ID is required.",
            },
        });

        return;
    }

    try {

        const deleted =
            await deleteCommissionRule(
                req.user.companyId,
                ruleId,
            );

        if (!deleted) {
            res.status(404).json({
                error: {
                    code:
                        "COMMISSION_RULE_NOT_FOUND",
                    message:
                        "Commission rule not found.",
                },
            });

            return;
        }

        res.status(200).json({
            data: {
                message:
                    "Commission rule deleted successfully.",
            },
        });

    } catch (error: unknown) {

        console.error(
            "Delete commission rule error:",
            error,
        );

        res.status(500).json({
            error: {
                code:
                    "COMMISSION_RULE_DELETE_FAILED",
                message:
                    "Failed to delete commission rule.",
            },
        });
    }
}