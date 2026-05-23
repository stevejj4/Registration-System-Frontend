import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "@/api/authApi";
import { Button } from "@/components/ui/Button";
import PasswordInput from "@/components/ui/PasswordInput";
import TextInput from "@/components/ui/TextInput";
import { isValidEmail, validatePasswordMinLength } from "@/utils/validation";

type LocationState = {
  email?: string;
  message?: string;
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) ?? {};

  const [email, setEmail] = useState(state.email ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit verification code from your email.");
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
      await resetPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });
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
      <p className="text-sm text-gray-600 mb-6">
        Enter your email, the 6-digit code we sent you, and your new password.
      </p>

      {state.message && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          {state.message}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <TextInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            disabled={loading}
          />
        </div>
        <div className="mb-3">
          <TextInput
            label="Verification code"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            disabled={loading}
          />
        </div>
        <div className="mb-3">
          <PasswordInput
            label="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
            disabled={loading}
          />
        </div>
        <div className="mb-3">
          <PasswordInput
            label="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            disabled={loading}
          />
        </div>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="flex items-center justify-between">
          <Link
            to="/forgot-password"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Request new code
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Reset password"}
          </Button>
        </div>
      </form>
    </div>
  );
}
