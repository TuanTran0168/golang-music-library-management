import { User, AuthResponse, LoginRequest, RegisterRequest } from "@/types/auth";
import api from "./api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

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

export async function login(req: LoginRequest): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/auth/login", req);
    setAuth(res.data.token, res.data.user);
    return res.data;
}

export async function register(req: RegisterRequest): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/auth/register", req);
    setAuth(res.data.token, res.data.user);
    return res.data;
}

export function logout() {
    clearAuth();
}
