import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../component/ui/input";
import Button from "../../component/ui/Button";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", {
                email,
                password,
            });

            const data = response.data.data;
            const token = data.token;
            const user = data.user;

            // Create application session
            login(token, user);

            // Navigate according to role
            switch (user.role) {
                case "COMPANY_ADMIN":
                    navigate("/admin/dashboard");
                    break;
                case "FINANCE":
                    navigate("/finance/dashboard");
                    break;
                case "AGENT":
                    navigate("/agent/dashboard");
                    break;
                default:
                    setError("Invalid user role.");
            }
        } catch (error: any) {
            console.error("Login error:", error);

            if (error.response?.status === 401) {
                setError("Invalid email or password.");
            } else {
                setError(
                    error.response?.data?.error?.message || "Login failed."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-900">
            {/* Left side: Visual / Image Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center p-12">
                <img
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop"
                    alt="Login illustration background"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

                <div className="relative z-10 max-w-md text-white space-y-4 text-center lg:text-left">
                    <div className="inline-block px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-wider uppercase backdrop-blur-sm">
                        MAD Group
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                        Streamline your workflow in one place.
                    </h1>
                    <p className="text-slate-300 text-base leading-relaxed">
                        Access your dashboard, manage operational tools, and keep your business running smoothly.
                    </p>
                </div>
            </div>

            {/* Right side: Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
                <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                    {/* Header */}
                    <div className="space-y-2 text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Sign In
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                <svg
                                    className="w-4 h-4 fill-current shrink-0"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M10 18a8 8 8 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg
                                        className="animate-spin h-4 w-4 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Logging in...
                                </span>
                            ) : (
                                "Log In"
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};