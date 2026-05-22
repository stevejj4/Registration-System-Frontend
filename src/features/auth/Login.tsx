import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import PasswordInput from "@/components/ui/PasswordInput";
import { getRoleHomePath } from "@/utils/routes";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = (location.state as { message?: string } | null)
    ?.message;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login({ email, password });
      navigate(getRoleHomePath(user.role), { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Sign in</h2>
      {successMessage && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          {successMessage}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <TextInput
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            label="Email"
            type="email"
            autoComplete="email"
            required
            disabled={loading}
          />
        </div>
        <div className="mb-2">
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            label="Password"
            autoComplete="current-password"
            required
            disabled={loading}
          />
        </div>
        <div className="mb-4 text-right">
          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Forgot password?
          </Link>
        </div>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Login;
