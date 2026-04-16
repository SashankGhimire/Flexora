export type ApiUser = {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  completedOnboarding?: boolean;
  createdByAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  completedOnboarding?: boolean;
};
import { apiFetch } from './api';

const parseApiErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    return data?.message || data?.error || fallback;
  } catch {
    return fallback;
  }
};

export async function fetchUsers(): Promise<ApiUser[]> {
  const response = await apiFetch('/api/auth/users');

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data?.users) ? data.users : [];
}

export async function fetchUserById(id: string): Promise<ApiUser> {
  const response = await apiFetch(`/api/auth/users/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }

  const data = await response.json();
  return data?.user;
}

export async function updateUserById(id: string, payload: UpdateUserPayload): Promise<ApiUser> {
  const response = await apiFetch(`/api/auth/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await parseApiErrorMessage(response, `Failed to update user: ${response.status}`);
    throw new Error(message);
  }

  const data = await response.json();
  return data?.user;
}

export async function deleteUserById(id: string): Promise<void> {
  const response = await apiFetch(`/api/auth/users/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete user: ${response.status}`);
  }
}

export async function createUser(payload: { name: string; email: string; password: string }): Promise<ApiUser> {
  const response = await apiFetch('/api/auth/admin/create-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await parseApiErrorMessage(response, `Failed to create user: ${response.status}`);
    throw new Error(message);
  }

  const data = await response.json();
  return data?.user;
}
