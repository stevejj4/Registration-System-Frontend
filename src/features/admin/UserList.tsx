import React, { useEffect, useMemo, useState } from "react";
import {
  getUsers,
  deleteUser,
  createUser,
  updateUser,
  resetUserPassword,
  updateUserRole,
  SystemUser,
} from "@/api/adminApi";
import { Button } from "@/components/ui/Button";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import CreateUserModal from "@/features/admin/CreateUserModal";
import EditUserModal from "@/features/admin/EditUserModal";
import ResetPasswordModal from "@/features/admin/ResetPasswordModal";
import { UpdateUserRequestDTO } from "@/types/auth";
import { UserRole } from "@/types/auth";
import { useAuth } from "@/hooks/useAuth";
import { isCurrentUserAccount } from "@/utils/userAccount";
import { Search } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 8;
const ASSIGNABLE_ROLES: UserRole[] = ["FACILITATOR", "COORDINATOR"];

export default function UserList() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SystemUser | null>(null);
  const [resetTarget, setResetTarget] = useState<SystemUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUsers();
      setUsers(res || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  const {
    page,
    setPage,
    paginatedItems: paginatedUsers,
    totalItems,
    totalPages,
    rangeStart,
    rangeEnd,
  } = usePagination(filteredUsers, PAGE_SIZE, [search]);

  const existingEmails = useMemo(
    () => users.map((u) => u.email),
    [users]
  );

  const handleCreate = async (data: Parameters<typeof createUser>[0]) => {
    setError(null);
    try {
      const result = await createUser(data);
      setUsers((prev) => [...prev, result.user]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Create failed";
      setError(message);
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (isCurrentUserAccount(currentUser, deleteTarget)) {
      setError("You cannot delete your own account.");
      setDeleteTarget(null);
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = async (id: string, data: UpdateUserRequestDTO) => {
    setError(null);
    try {
      const updated = await updateUser(id, data);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Update failed";
      setError(message);
      throw err;
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!resetTarget) return;
    await resetUserPassword(resetTarget.id, newPassword);
  };

  const handleChangeRole = async (id: string, newRole: UserRole) => {
    const target = users.find((u) => u.id === id);
    if (target && isCurrentUserAccount(currentUser, target)) {
      setError("You cannot change your own role.");
      return;
    }

    setError(null);
    try {
      await updateUserRole(id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Role update failed");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-medium">System Users</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            Create User
          </Button>
        </div>
      </div>

      <div className="mb-4 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search by name or email..."
          aria-label="Search users"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading && <p className="text-gray-600 mb-2">Loading...</p>}
      {error && (
        <p className="text-red-600 mb-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="overflow-x-auto bg-white rounded-md border">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                Name
              </th>
              <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                Email
              </th>
              <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                Role
              </th>
              <th className="px-4 py-2 text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  {search ? "No users match your search." : "No users found."}
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => {
                const isSelf = isCurrentUserAccount(currentUser, u);
                return (
                  <tr
                    key={u.id}
                    className={`border-t ${isSelf ? "bg-blue-50/50" : ""}`}
                  >
                    <td className="px-4 py-2">
                      <span className="font-medium">{u.fullName}</span>
                      {isSelf && (
                        <span className="ml-2 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{u.email}</td>
                    <td className="px-4 py-2">
                      <select
                        value={u.role}
                        disabled={isSelf}
                        title={
                          isSelf
                            ? "You cannot change your own role"
                            : undefined
                        }
                        onChange={(e) =>
                          handleChangeRole(u.id, e.target.value as UserRole)
                        }
                        className="border rounded-lg px-2 py-1.5 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                        {u.role === "ADMIN" && (
                          <option value="ADMIN">ADMIN</option>
                        )}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditTarget(u)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isSelf}
                          title={
                            isSelf
                              ? "You cannot delete your own account"
                              : undefined
                          }
                          onClick={() => setDeleteTarget(u)}
                        >
                          Delete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isSelf}
                          title={
                            isSelf
                              ? "Reset your password via account settings"
                              : undefined
                          }
                          onClick={() => setResetTarget(u)}
                        >
                          Reset Password
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onPageChange={setPage}
        className="mt-4 rounded-md border border-gray-200 bg-white"
      />

      <CreateUserModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        existingEmails={existingEmails}
      />

      <EditUserModal
        isOpen={!!editTarget}
        user={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
        existingEmails={existingEmails}
      />

      <ResetPasswordModal
        isOpen={!!resetTarget}
        userName={resetTarget?.fullName ?? ""}
        onClose={() => setResetTarget(null)}
        onSubmit={handleResetPassword}
      />

      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Delete user"
        message={
          deleteTarget
            ? `Are you sure you want to permanently delete ${deleteTarget.fullName} (${deleteTarget.email})? This action cannot be undone.`
            : ""
        }
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="danger"
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleting) void handleConfirmDelete();
        }}
      />
    </div>
  );
}
