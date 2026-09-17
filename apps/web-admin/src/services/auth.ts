import { apiFetch } from "./api";
import type { RespuestaLogin } from "@/types/auth";

export interface LoginBody {
  email: string;
  password: string;
}

// POST /api/v1/auth/login (spec 001) — único endpoint de login, compartido con mobile.
export function login(body: LoginBody): Promise<RespuestaLogin> {
  return apiFetch<RespuestaLogin>("/auth/login", { method: "POST", body });
}
