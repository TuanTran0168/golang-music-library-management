"use client";

import { useState } from "react";
import { login, register } from "@/lib/auth";

interface Props {
    onSuccess: () => void;
    onClose: () => void;
}

export default function AuthModal({ onSuccess, onClose }: Props) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (mode === "login") {
                await login({ email, password });
            } else {
                await register({ name, email, password });
            }
            onSuccess();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            setError(axiosErr.response?.data?.error || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="glass rounded-2xl p-8 w-full max-w-md relative slide-up">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gradient mb-2">
                        {mode === "login" ? "Welcome Back" : "Join Improok Music"}
                    </h2>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {mode === "login"
                            ? "Sign in to manage your playlists"
                            : "Create an account to get started"}
                    </p>
                </div>

                {/* Mode Toggle */}
                <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <button
                        type="button"
                        onClick={() => { setMode("login"); setError(""); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === "login"
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                            : "text-gray-400 hover:text-white"
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode("register"); setError(""); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === "register"
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                            : "text-gray-400 hover:text-white"
                            }`}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "register" && (
                        <input
                            type="text"
                            placeholder="Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="glass-input w-full p-3.5 text-sm"
                            required
                        />
                    )}

                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="glass-input w-full p-3.5 text-sm"
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="glass-input w-full p-3.5 text-sm"
                        required
                        minLength={6}
                    />

                    {error && (
                        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3 fade-in">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-accent w-full py-3.5 text-sm"
                    >
                        {loading ? "Please wait..." : (mode === "login" ? "Sign In" : "Create Account")}
                    </button>
                </form>

                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
