import { apiClient, handleError } from './client';

export interface SystemUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export const getUsers = async (): Promise<SystemUser[]> => {
  try {
    const res = await apiClient.get('/admin/users');
    return res.data as SystemUser[];
  } catch (err) {
    return handleError(err, 'Failed to load users');
  }
};

export const createUser = async (payload: { fullName: string; email: string; role: string; password?: string }) => {
  try {
    const res = await apiClient.post('/admin/users', payload);
    return res.data;
  } catch (err) {
    return handleError(err, 'Failed to create user');
  }
};

export const deleteUser = async (id: string) => {
  try {
    const res = await apiClient.delete(`/admin/users/${id}`);
    return res.data;
  } catch (err) {
    return handleError(err, 'Failed to delete user');
  }
};
