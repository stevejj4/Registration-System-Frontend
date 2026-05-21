import { apiClient, handleError } from './client';

/**
 * SystemUser — matches the shape UserList.tsx and AdminProvider expect.
 * Exported from here so components can import type and API from one place.
 */
export interface SystemUser {
  id: string;
  fullName: string;
  email: string;
  role: string;        // raw role string from backend, e.g. 'ROLE_FACILITATOR'
  rawRole?: string;
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
    return res.data;
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
    return res.data;
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
  data: Omit<SystemUser, 'id'>
): Promise<SystemUser> => {
  try {
    const res = await apiClient.post('/admin/register', data);
    return res.data;
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