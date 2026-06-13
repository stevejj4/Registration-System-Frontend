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
    <div className="min-h-screen w-full grid md:grid-cols-2">
      <aside
        className="hidden md:flex flex-col justify-between p-10 lg:p-14 text-white"
        style={{ backgroundColor: "var(--sidebar)" }}
        aria-hidden="true"
      >
        <div className="max-w-lg">
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight">
            SUN Welfare Management System
          </h1>
          <p className="mt-5 text-base lg:text-lg leading-relaxed text-white/90">
            Welcome to the official welfare administration and registration
            portal.
          </p>
        </div>

        <p className="text-xs text-white/70">Authorized Personnel Only.</p>
      </aside>

      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 sm:px-8">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sign in</h2>

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
            <div className="mb-4">
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                label="Password"
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <div className="mt-4 text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Forgot password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
