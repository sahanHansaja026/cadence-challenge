import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../db/client";
import type {
    LoginInput,
    SignupInput,
} from "../schemas/auth.schema";

export type UserRole =
    | "COMPANY_ADMIN"
    | "FINANCE"
    | "AGENT";

type User = {
    id: string;
    company_id: string;
    email: string;
    password_hash: string;
    role: UserRole;
};

type PublicUser = {
    id: string;
    companyId: string;
    email: string;
    role: UserRole;
};

export type AuthResult = {
    user: PublicUser;
    token: string;
};

export async function signup(
    input: SignupInput,
): Promise<AuthResult> {
    const existingUsers = await query<{ id: string }>(
        `
      SELECT id
      FROM users
      WHERE company_id = $1
        AND email = $2
    `,
        [input.companyId, input.email],
    );

    if (existingUsers.length > 0) {
        throw new Error("USER_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(
        input.password,
        12,
    );

    const users = await query<User>(
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
        password_hash,
        role
    `,
        [
            input.companyId,
            input.email,
            passwordHash,
            input.role,
        ],
    );

    const user = users[0];

    if (!user) {
        throw new Error("USER_CREATION_FAILED");
    }

    const token = createToken(user);

    return {
        user: toPublicUser(user),
        token,
    };
}

export async function login(
    input: LoginInput,
): Promise<AuthResult> {
    const users = await query<User>(
        `
      SELECT
        id,
        company_id,
        email,
        password_hash,
        role
      FROM users
      WHERE email = $1
    `,
        [input.email],
    );

    const user = users[0];

    if (!user) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const passwordMatches = await bcrypt.compare(
        input.password,
        user.password_hash,
    );

    if (!passwordMatches) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const token = createToken(user);

    return {
        user: toPublicUser(user),
        token,
    };
}

function createToken(user: User): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET_NOT_CONFIGURED");
    }

    return jwt.sign(
        {
            sub: user.id,
            companyId: user.company_id,
            role: user.role,
        },
        secret,
        {
            expiresIn: "1h",
        },
    );
}

function toPublicUser(
    user: User,
): PublicUser {
    return {
        id: user.id,
        companyId: user.company_id,
        email: user.email,
        role: user.role,
    };
}