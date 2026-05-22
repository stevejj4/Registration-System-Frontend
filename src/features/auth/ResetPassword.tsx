import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "@/api/authApi";
import { Button } from "@/components/ui/Button";
import PasswordInput from "@/components/ui/PasswordInput";
import { validatePasswordMinLength } from "@/utils/validation";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset link is invalid or missing. Request a new link.");
      return;
    }
    if (!validatePasswordMinLength(newPassword)) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, newPassword });
      navigate("/login", {
        replace: true,
        state: { message: "Password updated. Sign in with your new password." },
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to reset password.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-2">Reset password</h2>
      <p className="text-sm text-gray-600 mb-6">Enter your new password below.</p>

      {!token && (
        <p className="text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          This link is missing a reset token. Use the link from your email or
          request a new one.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <PasswordInput
            label="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
            disabled={loading || !token}
          />
        </div>
        <div className="mb-3">
          <PasswordInput
            label="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            disabled={loading || !token}
          />
        </div>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="flex items-center justify-between">
          <Link
            to="/forgot-password"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Request new link
          </Link>
          <Button type="submit" disabled={loading || !token}>
            {loading ? "Saving..." : "Reset password"}
          </Button>
        </div>
      </form>
    </div>
  );
}
