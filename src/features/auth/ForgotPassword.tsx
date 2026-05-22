import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "@/api/authApi";
import { Button } from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { isValidEmail } from "@/utils/validation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword({ email: email.trim() });
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send reset link.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-2">Forgot password</h2>
      <p className="text-sm text-gray-600 mb-6">
        Enter your email and we will send you a link to reset your password.
      </p>

      {success ? (
        <div className="space-y-4">
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-4">
            If an account exists for that email, a reset link has been sent.
            Check your inbox.
          </p>
          <Link
            to="/login"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <TextInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
              error={error && !isValidEmail(email) ? error : undefined}
            />
          </div>
          {error && isValidEmail(email) && (
            <p className="text-red-600 text-sm mb-3">{error}</p>
          )}
          <div className="flex items-center justify-between">
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Back to sign in
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
