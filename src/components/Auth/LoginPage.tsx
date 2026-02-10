/**
 * Login page with SOCC dark theme aesthetic.
 * Shown when auth is enabled and user is not authenticated.
 */

import { useState, useCallback, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setError(null);
    setSubmitting(true);

    try {
      const result = await login({ username: username.trim(), password });
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
    } catch {
      setError('Unexpected error — please try again');
    } finally {
      setSubmitting(false);
    }
  }, [username, password, login]);

  return (
    <div className="h-screen w-screen bg-socc-bg flex items-center justify-center overflow-hidden relative">
      {/* Background grid effect */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Radial glow blobs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-socc-cyan/[0.04] rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-socc-cyan/20 to-indigo-500/10 border border-socc-cyan/20 mb-4 shadow-lg shadow-socc-cyan/5"
          >
            <Shield className="w-8 h-8 text-socc-cyan" />
          </motion.div>
          <h1 className="text-lg font-semibold tracking-wide text-gradient-accent">
            SOCC Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-mono tracking-wider">
            SECURITY OPERATIONS COMMAND CENTER
          </p>
        </div>

        {/* Login Card */}
        <div className="relative bg-socc-surface/80 backdrop-blur-sm border border-socc-border/50 rounded-2xl p-6 shadow-[var(--socc-modal-shadow)] overflow-hidden">
          {/* Gradient accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-socc-cyan via-indigo-400 to-socc-cyan" />
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-xs text-red-400">{error}</span>
              </motion.div>
            )}

            {/* Username */}
            <div>
              <label htmlFor="login-username" className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  disabled={submitting}
                  className="w-full h-10 pl-10 pr-4 text-sm bg-socc-bg/80 border border-socc-border/50 rounded-xl
                    text-gray-200 placeholder:text-gray-600
                    focus:outline-none focus:border-socc-cyan/50 focus:ring-1 focus:ring-socc-cyan/20
                    disabled:opacity-50 transition-all"
                  placeholder="Enter username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={submitting}
                  className="w-full h-10 pl-10 pr-10 text-sm bg-socc-bg/80 border border-socc-border/50 rounded-xl
                    text-gray-200 placeholder:text-gray-600
                    focus:outline-none focus:border-socc-cyan/50 focus:ring-1 focus:ring-socc-cyan/20
                    disabled:opacity-50 transition-all"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !username.trim() || !password}
              className="w-full h-10 bg-socc-cyan/10 hover:bg-socc-cyan/20 border border-socc-cyan/30 hover:border-socc-cyan/50
                text-socc-cyan text-sm font-semibold rounded-xl
                hover:shadow-md hover:shadow-socc-cyan/10
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200 relative overflow-hidden"
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-socc-cyan/30 border-t-socc-cyan rounded-full animate-spin" />
                  <span>Authenticating…</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-600 mt-4 font-mono">
          Authorized personnel only
        </p>
      </motion.div>
    </div>
  );
}
