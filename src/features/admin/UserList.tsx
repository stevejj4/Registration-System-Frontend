import React, { useEffect, useState } from 'react';
import { getUsers, deleteUser, registerUser, resetUserPassword, updateUserRole, SystemUser } from '@/api/adminApi';
import { Button } from '@/components/ui/Button';
import { UserRole } from '@/types/auth';

export default function UserList() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUsers();
      setUsers(res || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const email = prompt("Enter email for new user:");
    const fullName = prompt("Enter full name:");
    const password = prompt("Enter temporary password:");
    const role: UserRole = "FACILITATOR"; // default role for now

    if (!email || !fullName || !password) return;

    try {
      const newUser = await registerUser({ email, fullName, password, role });
      setUsers(prev => [...prev, newUser]);
    } catch (err: any) {
      setError(err?.message || "Create failed");
    }
  };

  const handleResetPassword = async (id: string) => {
    const newPassword = prompt("Enter new password:");
    if (!newPassword) return;
    try {
      await resetUserPassword(id, newPassword);
      alert("Password reset successfully");
    } catch (err: any) {
      setError(err?.message || "Reset failed");
    }
  };
const handleDelete = async (id: string) => {
  if (!confirm("Delete user?")) return;
  try {
    await deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  } catch (err: any) {
    setError(err?.message || "Delete failed");
  }
};

  const handleChangeRole = async (id: string, newRole: UserRole) => {
    try {
      await updateUserRole(id, newRole);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err: any) {
      setError(err?.message || "Role update failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">System Users</h3>
        <div className="space-x-2">
          <Button variant="outline" onClick={load}>Refresh</Button>
          <Button variant="primary" onClick={handleCreate}>Create User</Button>
        </div>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="overflow-x-auto bg-white rounded-md border">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">{u.fullName}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">
                  <select
                    value={u.role}
                    onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="FACILITATOR">FACILITATOR</option>
                    <option value="COORDINATOR">COORDINATOR</option>
                  </select>
                </td>
                <td className="px-4 py-2 space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleDelete(u.id)}>Delete</Button>
                  <Button variant="outline" size="sm" onClick={() => handleResetPassword(u.id)}>Reset Password</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
