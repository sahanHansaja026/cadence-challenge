import { query } from "../db/client";
import type { CreateCompanyInput } from "../schemas/company.schema";

export async function createCompany(
    input: CreateCompanyInput,
) {
    const existing = await query<{ id: string }>(
        `
        SELECT id
        FROM companies
        WHERE id = $1
        `,
        [input.id],
    );

    if (existing.length > 0) {
        throw new Error("COMPANY_ALREADY_EXISTS");
    }

    const result = await query<{
        id: string;
        name: string;
        created_at: Date;
    }>(
        `
        INSERT INTO companies (
            id,
            name
        )
        VALUES ($1, $2)
        RETURNING
            id,
            name,
            created_at
        `,
        [
            input.id,
            input.name,
        ],
    );

    return result[0];
}