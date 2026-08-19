import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import {
    signup,
    login,
} from "../services/auth.service";

import { query } from "../db/client";

import bcrypt from "bcrypt";


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
 *
 * sign() explicitly returns a string.
 */
vi.mock("jsonwebtoken", () => ({
    default: {
        sign: vi.fn(
            () => "test-jwt-token",
        ),
    },
}));


const mockedQuery =
    vi.mocked(query);

const mockedHash =
    vi.mocked(bcrypt.hash);

const mockedCompare =
    vi.mocked(bcrypt.compare);


describe("Auth Service", () => {

    beforeEach(() => {

        vi.clearAllMocks();

        process.env.JWT_SECRET =
            "test-secret";

    });


    // ==========================================
    // SIGNUP
    // ==========================================

    describe("signup", () => {

        it("creates a new user and returns a token", async () => {

            /*
             * First query:
             * Check whether user already exists.
             */
            mockedQuery
                .mockResolvedValueOnce([])

                /*
                 * Second query:
                 * Insert new user.
                 */
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


            const result =
                await signup({
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


            expect(result.token)
                .toBe("test-jwt-token");


            expect(mockedHash)
                .toHaveBeenCalledWith(
                    "Password123",
                    12,
                );


            expect(mockedQuery)
                .toHaveBeenCalledTimes(2);

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
            ).rejects.toThrow(
                "USER_ALREADY_EXISTS",
            );


            /*
             * Password should not be hashed
             * when the user already exists.
             */
            expect(mockedHash)
                .not.toHaveBeenCalled();


            /*
             * Only the duplicate check
             * should have happened.
             */
            expect(mockedQuery)
                .toHaveBeenCalledTimes(1);

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
            ).rejects.toThrow(
                "USER_CREATION_FAILED",
            );

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


            mockedCompare.mockResolvedValue(
                true as never,
            );


            const result =
                await login({
                    email: "finance@test.com",
                    password: "Password123",
                });


            expect(result.user).toEqual({
                id: "user-1",
                companyId: "mad-marketing",
                email: "finance@test.com",
                role: "FINANCE",
            });


            expect(result.token)
                .toBe("test-jwt-token");


            expect(mockedCompare)
                .toHaveBeenCalledWith(
                    "Password123",
                    "hashed-password",
                );


            expect(mockedQuery)
                .toHaveBeenCalledTimes(1);

        });


        it("rejects login when user does not exist", async () => {

            mockedQuery.mockResolvedValueOnce([]);


            await expect(
                login({
                    email: "unknown@test.com",
                    password: "Password123",
                }),
            ).rejects.toThrow(
                "INVALID_CREDENTIALS",
            );


            /*
             * Password comparison should not
             * happen when the user does not exist.
             */
            expect(mockedCompare)
                .not.toHaveBeenCalled();

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


            mockedCompare.mockResolvedValue(
                false as never,
            );


            await expect(
                login({
                    email: "finance@test.com",
                    password: "WrongPassword",
                }),
            ).rejects.toThrow(
                "INVALID_CREDENTIALS",
            );


            /*
             * JWT must not be created when
             * password is incorrect.
             */
            expect(mockedCompare)
                .toHaveBeenCalledWith(
                    "WrongPassword",
                    "hashed-password",
                );

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


            mockedCompare.mockResolvedValue(
                true as never,
            );


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

});