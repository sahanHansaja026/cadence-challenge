import { beforeEach, describe, expect, it, vi } from "vitest";




vi.mock("../db/client", () => ({
    query: vi.fn(),
}));

vi.mock("bcrypt", () => ({
    default: {
        hash: vi.fn(),
    },
}));

import bcrypt from "bcrypt";
import { query } from "../db/client";
import { createUser, deleteUser, getUserById, getUsers, updateUser } from "../services/user.service";

const mockedQuery = vi.mocked(query);
const mockedHash = vi.mocked(bcrypt.hash);


describe("user.service", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });


    describe("createUser", () => {

        it("rejects duplicate users within the same company", async () => {

            mockedQuery.mockResolvedValueOnce([
                {
                    id: "existing-user",
                },
            ]);

            await expect(
                createUser(
                    {
                        email: "finance@test.com",
                        password: "password123",
                        role: "FINANCE",
                    },
                    "mad-marketing",
                ),
            ).rejects.toThrow(
                "USER_ALREADY_EXISTS",
            );

            expect(
                mockedHash,
            ).not.toHaveBeenCalled();

        });


        it("creates a user with a hashed password", async () => {

            mockedQuery
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([
                    {
                        id: "user-1",
                        company_id: "mad-marketing",
                        email: "finance@test.com",
                        role: "FINANCE",
                        created_at: new Date(),
                    },
                ]);

            mockedHash.mockResolvedValue(
                "hashed-password" as never,
            );

            const result =
                await createUser(
                    {
                        email: "finance@test.com",
                        password: "password123",
                        role: "FINANCE",
                    },
                    "mad-marketing",
                );

            expect(result?.email)
                .toBe("finance@test.com");

            expect(result?.role)
                .toBe("FINANCE");

            expect(mockedHash)
                .toHaveBeenCalledWith(
                    "password123",
                    12,
                );

        });

    });


    describe("getUsers", () => {

        it("returns users only from the requested company", async () => {

            mockedQuery.mockResolvedValueOnce([
                {
                    id: "user-1",
                    company_id: "mad-marketing",
                    email: "finance@test.com",
                    role: "FINANCE",
                    created_at: new Date(),
                },
            ]);

            const result =
                await getUsers(
                    "mad-marketing",
                );

            expect(result)
                .toHaveLength(1);

            expect(
                mockedQuery,
            ).toHaveBeenCalledWith(
                expect.stringContaining(
                    "WHERE company_id = $1",
                ),
                ["mad-marketing"],
            );

        });

    });


    describe("updateUser", () => {

        it("rejects updating a user from another company", async () => {

            mockedQuery.mockResolvedValueOnce([]);

            await expect(
                updateUser(
                    "user-1",
                    "mad-marketing",
                    "finance@test.com",
                    "FINANCE",
                ),
            ).rejects.toThrow(
                "USER_NOT_FOUND",
            );

        });


        it("rejects duplicate email within the same company", async () => {

            mockedQuery
                .mockResolvedValueOnce([
                    {
                        id: "user-1",
                    },
                ])
                .mockResolvedValueOnce([
                    {
                        id: "user-2",
                    },
                ]);

            await expect(
                updateUser(
                    "user-1",
                    "mad-marketing",
                    "finance@test.com",
                    "FINANCE",
                ),
            ).rejects.toThrow(
                "USER_ALREADY_EXISTS",
            );

        });


        it("updates the password when a new password is provided", async () => {

            mockedQuery
                .mockResolvedValueOnce([
                    {
                        id: "user-1",
                    },
                ])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([
                    {
                        id: "user-1",
                        company_id: "mad-marketing",
                        email: "finance@test.com",
                        role: "FINANCE",
                        created_at: new Date(),
                    },
                ]);

            mockedHash.mockResolvedValue(
                "new-hashed-password" as never,
            );

            const result =
                await updateUser(
                    "user-1",
                    "mad-marketing",
                    "finance@test.com",
                    "FINANCE",
                    "new-password",
                );

            expect(result?.id)
                .toBe("user-1");

            expect(mockedHash)
                .toHaveBeenCalledWith(
                    "new-password",
                    12,
                );

        });

    });


    describe("deleteUser", () => {

        it("deletes only FINANCE or AGENT users from the company", async () => {

            mockedQuery.mockResolvedValueOnce([
                {
                    id: "user-1",
                },
            ]);

            const result =
                await deleteUser(
                    "user-1",
                    "mad-marketing",
                );

            expect(result)
                .toEqual({
                    id: "user-1",
                });

            expect(
                mockedQuery,
            ).toHaveBeenCalledWith(
                expect.stringContaining(
                    "role IN ('FINANCE', 'AGENT')",
                ),
                [
                    "user-1",
                    "mad-marketing",
                ],
            );

        });


        it("throws when the user does not exist", async () => {

            mockedQuery.mockResolvedValueOnce([]);

            await expect(
                deleteUser(
                    "missing-user",
                    "mad-marketing",
                ),
            ).rejects.toThrow(
                "USER_NOT_FOUND",
            );

        });

    });


    describe("getUserById", () => {

        it("returns null when the user belongs to another company", async () => {

            mockedQuery.mockResolvedValueOnce([]);

            const result =
                await getUserById(
                    "user-1",
                    "mad-marketing",
                );

            expect(result)
                .toBeNull();

            expect(
                mockedQuery,
            ).toHaveBeenCalledWith(
                expect.stringContaining(
                    "AND company_id = $2",
                ),
                [
                    "user-1",
                    "mad-marketing",
                ],
            );

        });

    });

});