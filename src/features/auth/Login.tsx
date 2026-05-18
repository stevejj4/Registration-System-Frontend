import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import TextInput from '@/components/ui/TextInput';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      // simple redirect to root
      window.location.href = '/';
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Sign in</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <TextInput value={email} onChange={(value) => setEmail(value)} label="Email" type="email" required />
        </div>
        <div className="mb-3">
          <TextInput value={password} onChange={(value) => setPassword(value)} label="Password" type="password" required />
        </div>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
        </div>
      </form>
    </div>
  );
};

export default Login;
