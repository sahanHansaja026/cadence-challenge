import bcrypt from "bcrypt";

import { query } from "../db/client";

import type {
    CreateUserInput,
} from "../schemas/user.schema";

//crate users
export async function createUser(
    input: CreateUserInput,
    companyId: string,
) {
    const existing = await query<{ id: string }>(
        `
        SELECT id
        FROM users
        WHERE company_id = $1
          AND email = $2
        `,
        [
            companyId,
            input.email,
        ],
    );

    if (existing.length > 0) {
        throw new Error("USER_ALREADY_EXISTS");
    }

    const passwordHash =
        await bcrypt.hash(input.password, 12);

    const result = await query<{
        id: string;
        company_id: string;
        email: string;
        role: "FINANCE" | "AGENT";
        created_at: Date;
    }>(
        `
        INSERT INTO users (
            company_id,
            email,
            password_hash,
            role
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
            id,
            company_id,
            email,
            role,
            created_at
        `,
        [
            companyId,
            input.email,
            passwordHash,
            input.role,
        ],
    );

    return result[0];
}
// get users
export async function getUsers(
    companyId: string,
) {
    const users = await query<{
        id: string;
        company_id: string;
        email: string;
        role:
        | "COMPANY_ADMIN"
        | "FINANCE"
        | "AGENT";
        created_at: Date;
    }>(
        `
        SELECT
            id,
            company_id,
            email,
            role,
            created_at
        FROM users
        WHERE company_id = $1
        ORDER BY created_at DESC
        `,
        [companyId],
    );

    return users;
}

export async function updateUser(
    userId: string,
    companyId: string,
    email: string,
    role: "FINANCE" | "AGENT",
    password?: string,
) {
    // Check user belongs to current company
    const existing = await query<{ id: string }>(
        `
        SELECT id
        FROM users
        WHERE id = $1
          AND company_id = $2
        `,
        [userId, companyId],
    );

    if (existing.length === 0) {
        throw new Error("USER_NOT_FOUND");
    }

    // Check duplicate email
    const duplicate = await query<{ id: string }>(
        `
        SELECT id
        FROM users
        WHERE company_id = $1
          AND email = $2
          AND id != $3
        `,
        [
            companyId,
            email,
            userId,
        ],
    );

    if (duplicate.length > 0) {
        throw new Error("USER_ALREADY_EXISTS");
    }

    // Update password if provided
    if (password) {
        const passwordHash =
            await bcrypt.hash(password, 12);

        const result = await query<{
            id: string;
            company_id: string;
            email: string;
            role: "FINANCE" | "AGENT";
            created_at: Date;
        }>(
            `
            UPDATE users
            SET
                email = $1,
                role = $2,
                password_hash = $3
            WHERE id = $4
              AND company_id = $5
            RETURNING
                id,
                company_id,
                email,
                role,
                created_at
            `,
            [
                email,
                role,
                passwordHash,
                userId,
                companyId,
            ],
        );

        return result[0];
    }

    // Update without changing password
    const result = await query<{
        id: string;
        company_id: string;
        email: string;
        role: "FINANCE" | "AGENT";
        created_at: Date;
    }>(
        `
        UPDATE users
        SET
            email = $1,
            role = $2
        WHERE id = $3
          AND company_id = $4
        RETURNING
            id,
            company_id,
            email,
            role,
            created_at
        `,
        [
            email,
            role,
            userId,
            companyId,
        ],
    );

    return result[0];
}


// ============================================
// DELETE USER
// ============================================

export async function deleteUser(
    userId: string,
    companyId: string,
) {
    const result = await query<{
        id: string;
    }>(
        `
        DELETE FROM users
        WHERE id = $1
          AND company_id = $2
          AND role IN ('FINANCE', 'AGENT')
        RETURNING id
        `,
        [
            userId,
            companyId,
        ],
    );

    if (result.length === 0) {
        throw new Error("USER_NOT_FOUND");
    }

    return result[0];
}

// get user by id
export async function getUserById(
    userId: string,
    companyId: string,
) {
    const result = await query<{
        id: string;
        company_id: string;
        email: string;
        role: "COMPANY_ADMIN" | "FINANCE" | "AGENT";
        created_at: Date;
    }>(
        `
        SELECT
            id,
            company_id,
            email,
            role,
            created_at
        FROM users
        WHERE id = $1
          AND company_id = $2
        `,
        [userId, companyId],
    );

    return result[0] ?? null;
}