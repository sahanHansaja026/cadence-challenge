import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import bcrypt from "bcrypt";
import { query } from "../db/client";
import { login, signup } from "../services/auth.service";

/*
 * Mock database.
 */
vi.mock("../db/client", () => ({
    query: vi.fn(),
}));

/*
 * Mock bcrypt.
 */
vi.mock("bcrypt", () => ({
    default: {
        hash: vi.fn(),
        compare: vi.fn(),
    },
}));

/*
 * Mock jsonwebtoken.
 */
vi.mock("jsonwebtoken", () => ({
    default: {
        sign: vi.fn(() => "test-jwt-token"),
    },
}));

const mockedQuery = vi.mocked(query);
const mockedHash = vi.mocked(bcrypt.hash);
const mockedCompare = vi.mocked(bcrypt.compare);

describe("Auth Service", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        process.env.JWT_SECRET = "test-secret";
    });

    // ==========================================
    // SIGNUP
    // ==========================================

    describe("signup", () => {
        it("creates a new user and returns a token", async () => {
            mockedQuery
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([
                    {
                        id: "user-1",
                        company_id: "mad-marketing",
                        email: "finance@test.com",
                        password_hash: "hashed-password",
                        role: "FINANCE",
                    },
                ]);

            mockedHash.mockResolvedValue(
                "hashed-password" as never,
            );

            const result = await signup({
                companyId: "mad-marketing",
                email: "finance@test.com",
                password: "Password123",
                role: "FINANCE",
            });

            expect(result.user).toEqual({
                id: "user-1",
                companyId: "mad-marketing",
                email: "finance@test.com",
                role: "FINANCE",
            });

            expect(result.token).toBe("test-jwt-token");

            expect(mockedHash).toHaveBeenCalledWith(
                "Password123",
                12,
            );

            expect(mockedQuery).toHaveBeenCalledTimes(2);
        });

        it("rejects signup when the user already exists", async () => {
            mockedQuery.mockResolvedValueOnce([
                {
                    id: "existing-user",
                },
            ]);

            await expect(
                signup({
                    companyId: "mad-marketing",
                    email: "finance@test.com",
                    password: "Password123",
                    role: "FINANCE",
                }),
            ).rejects.toThrow("USER_ALREADY_EXISTS");

            expect(mockedHash).not.toHaveBeenCalled();

            expect(mockedQuery).toHaveBeenCalledTimes(1);
        });

        it("throws when user creation returns no user", async () => {
            mockedQuery
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            mockedHash.mockResolvedValue(
                "hashed-password" as never,
            );

            await expect(
                signup({
                    companyId: "mad-marketing",
                    email: "agent@test.com",
                    password: "Password123",
                    role: "AGENT",
                }),
            ).rejects.toThrow("USER_CREATION_FAILED");
        });
    });

    // ==========================================
    // LOGIN
    // ==========================================

    describe("login", () => {
        it("logs in with valid credentials", async () => {
            mockedQuery.mockResolvedValueOnce([
                {
                    id: "user-1",
                    company_id: "mad-marketing",
                    email: "finance@test.com",
                    password_hash: "hashed-password",
                    role: "FINANCE",
                },
            ]);

            mockedCompare.mockResolvedValue(true as never);

            const result = await login({
                email: "finance@test.com",
                password: "Password123",
            });

            expect(result.user).toEqual({
                id: "user-1",
                companyId: "mad-marketing",
                email: "finance@test.com",
                role: "FINANCE",
            });

            expect(result.token).toBe("test-jwt-token");

            expect(mockedCompare).toHaveBeenCalledWith(
                "Password123",
                "hashed-password",
            );

            expect(mockedQuery).toHaveBeenCalledTimes(1);
        });

        it("rejects login when user does not exist", async () => {
            mockedQuery.mockResolvedValueOnce([]);

            await expect(
                login({
                    email: "unknown@test.com",
                    password: "Password123",
                }),
            ).rejects.toThrow("INVALID_CREDENTIALS");

            expect(mockedCompare).not.toHaveBeenCalled();
        });

        it("rejects login when password is incorrect", async () => {
            mockedQuery.mockResolvedValueOnce([
                {
                    id: "user-1",
                    company_id: "mad-marketing",
                    email: "finance@test.com",
                    password_hash: "hashed-password",
                    role: "FINANCE",
                },
            ]);

            mockedCompare.mockResolvedValue(false as never);

            await expect(
                login({
                    email: "finance@test.com",
                    password: "WrongPassword",
                }),
            ).rejects.toThrow("INVALID_CREDENTIALS");

            expect(mockedCompare).toHaveBeenCalledWith(
                "WrongPassword",
                "hashed-password",
            );
        });

        /*
         * MULTI-TENANT TEST
         *
         * The companyId returned by login must come from
         * the authenticated database record.
         */
        it("returns the company associated with the authenticated user", async () => {
            mockedQuery.mockResolvedValueOnce([
                {
                    id: "user-company-b",
                    company_id: "company-b",
                    email: "agent@test.com",
                    password_hash: "hashed-password",
                    role: "AGENT",
                },
            ]);

            mockedCompare.mockResolvedValue(true as never);

            const result = await login({
                email: "agent@test.com",
                password: "Password123",
            });

            expect(result.user).toEqual({
                id: "user-company-b",
                companyId: "company-b",
                email: "agent@test.com",
                role: "AGENT",
            });

            expect(result.user.companyId).toBe("company-b");
        });

        /*
         * MULTI-TENANT / SAME EMAIL TEST
         *
         * This checks what happens if the same email exists
         * for two different companies.
         */
        it("does not mix users between companies when the same email exists", async () => {
            mockedQuery.mockResolvedValueOnce([
                {
                    id: "user-company-a",
                    company_id: "company-a",
                    email: "agent@test.com",
                    password_hash: "hash-a",
                    role: "AGENT",
                },
            ]);

            mockedCompare.mockResolvedValue(true as never);

            const result = await login({
                email: "agent@test.com",
                password: "Password123",
            });

            expect(result.user.id).toBe("user-company-a");
            expect(result.user.companyId).toBe("company-a");
            expect(result.user.email).toBe("agent@test.com");
            expect(result.user.role).toBe("AGENT");
        });
    });

    // ==========================================
    // JWT
    // ==========================================

    describe("JWT configuration", () => {
        it("throws when JWT_SECRET is missing", async () => {
            delete process.env.JWT_SECRET;

            mockedQuery.mockResolvedValueOnce([
                {
                    id: "user-1",
                    company_id: "mad-marketing",
                    email: "finance@test.com",
                    password_hash: "hashed-password",
                    role: "FINANCE",
                },
            ]);

            mockedCompare.mockResolvedValue(true as never);

            await expect(
                login({
                    email: "finance@test.com",
                    password: "Password123",
                }),
            ).rejects.toThrow(
                "JWT_SECRET_NOT_CONFIGURED",
            );
        });
    });

    // ==========================================
    // ROLE TESTS
    // ==========================================

    describe("roles", () => {
        it("returns COMPANY_ADMIN role correctly", async () => {
            mockedQuery.mockResolvedValueOnce([
                {
                    id: "admin-1",
                    company_id: "company-a",
                    email: "admin@test.com",
                    password_hash: "hashed-password",
                    role: "COMPANY_ADMIN",
                },
            ]);

            mockedCompare.mockResolvedValue(true as never);

            const result = await login({
                email: "admin@test.com",
                password: "Password123",
            });

            expect(result.user.role).toBe("COMPANY_ADMIN");
            expect(result.user.companyId).toBe("company-a");
        });

        it("returns FINANCE role correctly", async () => {
            mockedQuery.mockResolvedValueOnce([
                {
                    id: "finance-1",
                    company_id: "company-a",
                    email: "finance@test.com",
                    password_hash: "hashed-password",
                    role: "FINANCE",
                },
            ]);

            mockedCompare.mockResolvedValue(true as never);

            const result = await login({
                email: "finance@test.com",
                password: "Password123",
            });

            expect(result.user.role).toBe("FINANCE");
            expect(result.user.companyId).toBe("company-a");
        });

        it("returns AGENT role correctly", async () => {
            mockedQuery.mockResolvedValueOnce([
                {
                    id: "agent-1",
                    company_id: "company-a",
                    email: "agent@test.com",
                    password_hash: "hashed-password",
                    role: "AGENT",
                },
            ]);

            mockedCompare.mockResolvedValue(true as never);

            const result = await login({
                email: "agent@test.com",
                password: "Password123",
            });

            expect(result.user.role).toBe("AGENT");
            expect(result.user.companyId).toBe("company-a");
        });
    });
});