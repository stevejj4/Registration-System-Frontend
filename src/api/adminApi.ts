import { apiClient, handleError } from './client';
import { normalizeRole } from '@/utils/auth';
import type { CreateUserRequestDTO } from '@/types/auth';
import type { UserRole } from '@/types/enums';

export interface SystemUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

function mapSystemUser(raw: Record<string, unknown>): SystemUser {
  const normalized = normalizeRole(String(raw.role ?? ''));
  return {
    id: String(raw.id),
    fullName: String(raw.fullName ?? ''),
    email: String(raw.email ?? ''),
    role: normalized ?? 'FACILITATOR',
  };
}

const ADMIN_USERS_BASE = '/v1/admin/users';

export const getUsers = async (): Promise<SystemUser[]> => {
  try {
    const res = await apiClient.get(ADMIN_USERS_BASE);
    const rows = Array.isArray(res.data) ? res.data : [];
    return rows.map((row) => mapSystemUser(row as Record<string, unknown>));
  } catch (error) {
    handleError(error, 'Failed to fetch system users');
    throw error;
  }
};

export interface CreateUserResult {
  user: SystemUser;
  message: string;
}

export const createUser = async (
  data: CreateUserRequestDTO
): Promise<CreateUserResult> => {
  try {
    const res = await apiClient.post<{ user: Record<string, unknown>; message: string }>(
      ADMIN_USERS_BASE,
      data
    );
    return {
      message: res.data.message,
      user: mapSystemUser(res.data.user),
    };
  } catch (error) {
    handleError(error, 'Failed to create system user');
    throw error;
  }
};

export const registerUser = createUser;

export const deleteUser = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`${ADMIN_USERS_BASE}/${id}`);
  } catch (error) {
    handleError(error, 'Failed to delete system user');
    throw error;
  }
};

export const resetUserPassword = async (
  userId: string,
  newPassword: string
): Promise<void> => {
  if (!userId) throw new Error('User ID is required');
  if (!newPassword) throw new Error('New password is required');
  try {
    await apiClient.put(`${ADMIN_USERS_BASE}/${userId}/reset-password`, {
      newPassword,
    });
  } catch (error) {
    handleError(error, 'Failed to reset user password');
    throw error;
  }
};

export const updateUserRole = async (
  userId: string,
  newRole: UserRole
): Promise<void> => {
  if (!userId) throw new Error('User ID is required');
  if (!newRole) throw new Error('New role is required');
  try {
    await apiClient.put(`${ADMIN_USERS_BASE}/${userId}/role`, { role: newRole });
  } catch (error) {
    handleError(error, 'Failed to update user role');
    throw error;
  }
};
