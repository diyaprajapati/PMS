import { apiClient } from "@/services/http-client";

export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export async function registerUser(payload: RegisterPayload) {
  return apiClient<{ message: string; user: AuthUser }>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser() {
  const result = await apiClient<{ user: AuthUser }>("/api/auth/me");
  return result.user;
}
