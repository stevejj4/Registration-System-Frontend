import { RegisterUserDTO } from 'src/types/auth';
import { apiClient, handleError } from './client';
import { normalizeRole } from '@/utils/auth';
import type { UserRole } from '@/types/enums';

/**
 * SystemUser — matches the shape UserList.tsx and AdminProvider expect.
 * Exported from here so components can import type and API from one place.
 */
export interface SystemUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

function mapSystemUser(raw: Record<string, unknown>): SystemUser {
  const normalized = normalizeRole(String(raw.role ?? ""));
  return {
    id: String(raw.id),
    fullName: String(raw.fullName ?? ""),
    email: String(raw.email ?? ""),
    role: normalized ?? "FACILITATOR",
  };
}

/**
 * ADMIN API
 * Handles admin-only operations: system user management and password resets.
 * apiClient.baseURL is already /api so paths here are relative to that.
 */

/**
 * Fetch all system users (facilitators + coordinators).
 * Used by UserList.tsx on mount and refresh.
 * Routes to GET /api/admin/users
 */
export const getUsers = async (): Promise<SystemUser[]> => {
  try {
    const res = await apiClient.get('/admin/users');
    const rows = Array.isArray(res.data) ? res.data : [];
    return rows.map((row) => mapSystemUser(row as Record<string, unknown>));
  } catch (error) {
    handleError(error, 'Failed to fetch system users');
    throw error;
  }
};

/**
 * Fetch a single system user by ID.
 * Routes to GET /api/admin/users/{id}
 */
export const getUserById = async (id: string): Promise<SystemUser> => {
  try {
    const res = await apiClient.get(`/admin/users/${id}`);
    return mapSystemUser(res.data as Record<string, unknown>);
  } catch (error) {
    handleError(error, 'Failed to fetch system user');
    throw error;
  }
};

/**
 * Register a new system user account (facilitator or coordinator).
 * Routes to POST /api/admin/user/register
 */
export const registerUser = async (
  data: RegisterUserDTO
): Promise<SystemUser> => {
  try {
    const res = await apiClient.post('/admin/register', data);
    return mapSystemUser(res.data as Record<string, unknown>);
  } catch (error) {
    handleError(error, 'Failed to register system user');
    throw error;
  }
};

/**
 * Delete a system user account.
 * Used by UserList.tsx delete button.
 * Routes to DELETE /api/admin/users/{id}
 */


export const deleteUser = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/admin/users/${id}`);
  } catch (error) {
    handleError(error, 'Failed to delete system user');
    throw error;
  }
};

/**
 * Reset a principal member's password.
 * Routes to POST /api/admin/members/{memberId}/reset-password
 */

/*
export const resetMemberPassword = async (
  memberId: string,
  newPassword: string
): Promise<void> => {
  if (!memberId) throw new Error('Member ID is required');
  if (!newPassword) throw new Error('New password is required');
  try {
    await apiClient.put(`/admin/members/${memberId}/reset-password`, {
      newPassword,
    });
  } catch (error) {
    handleError(error, 'Failed to reset member password');
    throw error;
  }
};
*/
/**
 * Reset a system user's password (facilitator / coordinator).
 * Routes to POST /api/admin/users/{userId}/reset-password
 */
export const resetUserPassword = async (
  userId: string,
  newPassword: string
): Promise<void> => {
  if (!userId) throw new Error('User ID is required');
  if (!newPassword) throw new Error('New password is required');
  try {
    await apiClient.put(`/admin/users/${userId}/reset-password`, {
      newPassword,
    });
  } catch (error) {
    handleError(error, 'Failed to reset user password');
    throw error;
  }
};
/**
 * Update a system user's role.
 * Routes to PUT /api/admin/users/{userId}/role
 */
export const updateUserRole = async (
  userId: string,
  newRole: UserRole
): Promise<void> => {
  if (!userId) throw new Error('User ID is required');
  if (!newRole) throw new Error('New role is required');
  try {
    await apiClient.put(`/admin/users/${userId}/role`, { role: newRole });
  } catch (error) {
    handleError(error, 'Failed to update user role');
    throw error;
  }
};
