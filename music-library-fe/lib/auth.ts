import { User, AuthResponse, LoginRequest, RegisterRequest } from "@/types/auth";
import axios from "axios";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function setAuth(token: string, user: User) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export function isLoggedIn(): boolean {
    return !!getToken();
}

export function hasRole(...roles: string[]): boolean {
    const user = getUser();
    if (!user) return false;
    return roles.includes(user.role);
}

// Uses a bare axios call (not the intercepted instance) to avoid infinite loops
export async function refreshAccessToken(): Promise<string | null> {
    try {
        const res = await axios.post<AuthResponse>(
            `${API_BASE}/auth/refresh`,
            {},
            { withCredentials: true } // sends the HTTP-only cookie
        );
        const { access_token, user } = res.data;
        setAuth(access_token, user);
        return access_token;
    } catch {
        clearAuth();
        return null;
    }
}

export async function login(req: LoginRequest): Promise<AuthResponse> {
    const res = await axios.post<AuthResponse>(`${API_BASE}/auth/login`, req, { withCredentials: true });
    setAuth(res.data.access_token, res.data.user);
    return res.data;
}

export async function register(req: RegisterRequest): Promise<AuthResponse> {
    const res = await axios.post<AuthResponse>(`${API_BASE}/auth/register`, req, { withCredentials: true });
    setAuth(res.data.access_token, res.data.user);
    return res.data;
}

export async function logout(): Promise<void> {
    try {
        const token = getToken();
        if (token) {
            await axios.post(`${API_BASE}/auth/logout`, {}, {
                withCredentials: true,
                headers: { Authorization: `Bearer ${token}` }
            });
        }
    } finally {
        clearAuth();
    }
}
