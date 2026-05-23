import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "@/api/authApi";
import { Button } from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { isValidEmail } from "@/utils/validation";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const message = await forgotPassword({ email: email.trim() });
      setInfo(message);
      navigate("/reset-password", {
        state: { email: email.trim(), message },
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send verification code.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-2">Forgot password</h2>
      <p className="text-sm text-gray-600 mb-6">
        Enter your email address. We will send a 6-digit verification code if an
        account exists.
      </p>

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
        {info && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            {info}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Back to sign in
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send code"}
          </Button>
        </div>
      </form>
    </div>
  );
}
