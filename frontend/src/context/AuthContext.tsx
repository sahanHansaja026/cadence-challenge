import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

export type UserRole =
    | "COMPANY_ADMIN"
    | "FINANCE"
    | "AGENT";

export type User = {
    id: string;
    email: string;
    companyId: string;
    role: UserRole;
};

type AuthSession = {
    token: string;
    user: User;
};

type AuthContextType = {
    session: AuthSession | null;
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (
        token: string,
        user: User
    ) => void;
    logout: () => void;
};

const AuthContext =
    createContext<AuthContextType | undefined>(
        undefined
    );

export function AuthProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [session, setSession] =
        useState<AuthSession | null>(null);

    const [isLoading, setIsLoading] =
        useState(true);

    useEffect(() => {
        const token =
            localStorage.getItem("token");

        const storedUser =
            localStorage.getItem("user");

        if (token && storedUser) {
            try {
                const user: User =
                    JSON.parse(storedUser);

                setSession({
                    token,
                    user,
                });
            } catch {
                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "user"
                );
            }
        }

        // Session restoration finished
        setIsLoading(false);
    }, []);

    const login = (
        token: string,
        user: User
    ) => {
        localStorage.setItem(
            "token",
            token
        );

        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );

        setSession({
            token,
            user,
        });
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setSession(null);
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user: session?.user ?? null,
                token: session?.token ?? null,

                isAuthenticated:
                    session !== null,

                isLoading,

                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context =
        useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
}