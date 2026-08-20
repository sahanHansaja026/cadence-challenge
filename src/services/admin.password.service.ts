
import bcrypt from "bcrypt";

import { query } from "../db/client";


// ============================================
// CHANGE OWN PASSWORD
// ============================================

export async function changeOwnPassword(
    userId: string,
    companyId: string,
    currentPassword: string,
    newPassword: string,
): Promise<void> {

    /*
     * Get the authenticated user's password hash.
     *
     * company_id is included to guarantee
     * tenant isolation.
     */
    const users = await query<{
        id: string;
        password_hash: string;
        role:
        | "COMPANY_ADMIN"
        | "FINANCE"
        | "AGENT";
    }>(
        `
SELECT
id,
    password_hash,
    role
        FROM users
        WHERE id = $1
          AND company_id = $2
        LIMIT 1
    `,
        [
            userId,
            companyId,
        ],
    );


    const user = users[0];


    if (!user) {
        throw new Error(
            "USER_NOT_FOUND",
        );
    }


    /*
     * Only COMPANY_ADMIN can use this operation.
     */
    if (user.role !== "COMPANY_ADMIN") {
        throw new Error(
            "ONLY_COMPANY_ADMIN_CAN_CHANGE_PASSWORD",
        );
    }


    /*
     * Verify the current password.
     */
    const passwordMatches =
        await bcrypt.compare(
            currentPassword,
            user.password_hash,
        );


    if (!passwordMatches) {
        throw new Error(
            "INVALID_CURRENT_PASSWORD",
        );
    }


    /*
     * Prevent using the same password again.
     */
    const samePassword =
        await bcrypt.compare(
            newPassword,
            user.password_hash,
        );


    if (samePassword) {
        throw new Error(
            "NEW_PASSWORD_MUST_BE_DIFFERENT",
        );
    }


    /*
     * Hash the new password.
     */
    const passwordHash =
        await bcrypt.hash(
            newPassword,
            12,
        );


    /*
     * Update ONLY the authenticated user.
     */
    const result = await query<{
        id: string;
    }>(
        `
        UPDATE users
SET
password_hash = $1
        WHERE id = $2
          AND company_id = $3
          AND role = 'COMPANY_ADMIN'
        RETURNING id
    `,
        [
            passwordHash,
            userId,
            companyId,
        ],
    );


    if (result.length === 0) {
        throw new Error(
            "PASSWORD_UPDATE_FAILED",
        );
    }
}

