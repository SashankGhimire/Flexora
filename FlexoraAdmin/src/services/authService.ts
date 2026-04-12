import { resolveApiBaseUrl } from './api';
import type { ApiUser } from './usersService';

export type AuthSession = {
  token: string;
  user: ApiUser & { role?: string };
};

export async function loginAdmin(email: string, password: string): Promise<AuthSession> {
  const baseUrl = await resolveApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Login failed. Please check your credentials.');
  }

  return {
    token: data?.token,
    user: data?.user,
  };
}