import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import NjerkaLogo from '../../components/NjerkaLogo';
import { useAdminAuth } from '../context/AdminAuthProvider';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/admin/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-peak-white rounded-container border border-limestone p-8">
          <div className="flex flex-col items-center mb-8">
            <NjerkaLogo size="medium" />
            <h1 className="text-title text-summit-black text-center mt-3">Admin Login</h1>
            <p className="text-body text-gravel text-center mt-1">
              Sign in to manage Njerka
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-field bg-ember/5 border border-ember/20">
                <p className="text-sm text-ember font-medium">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="admin-email" className="text-label text-trail-gray block mb-1.5">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@njerka.com"
                required
                autoComplete="email"
                className="w-full h-11 px-3.5 rounded-field bg-pebble border border-limestone text-sm text-summit-black placeholder:text-dust focus:outline-none focus:ring-2 focus:ring-forest-mist focus:ring-offset-0 transition-shadow"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="text-label text-trail-gray block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full h-11 px-3.5 pr-10 rounded-field bg-pebble border border-limestone text-sm text-summit-black placeholder:text-dust focus:outline-none focus:ring-2 focus:ring-forest-mist focus:ring-offset-0 transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dust hover:text-trail-gray transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-button bg-forest-canopy text-peak-white text-sm font-bold hover:bg-forest-deep transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
