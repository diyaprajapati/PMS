import { ApiClient } from "@/lib/api-client";

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
  return ApiClient.post<{ message: string; user: AuthUser }>("/api/auth/register", payload);
}

export async function getCurrentUser() {
  const result = await ApiClient.get<{ user: AuthUser }>("/api/auth/me");
  return result.user;
}
