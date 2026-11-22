import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { api } from '../../lib/api';
import { SeoHead } from '../../components/SeoHead';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isProvisioned, setIsProvisioned] = useState(true);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const status = await api.getAuthStatus();
        if (!active) return;
        if (status.authenticated) {
          navigate('/admin', { replace: true });
          return;
        }
        setIsProvisioned(status.isProvisioned);
      } catch {
        // Stay on login page
      } finally {
        if (active) setChecking(false);
      }
    }
    check();
    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Please enter your administrator username.');
      return;
    }

    if (username.includes('@')) {
      setError('Please sign in using your administrator username.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      if (!isProvisioned) {
        await api.provisionInitialAdmin(username.trim(), password);
      } else {
        await api.loginAdmin(username.trim(), password);
      }
      navigate('/admin', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Invalid administrator credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#101C32] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D6AD32]" />
      </div>
    );
  }

  return (
    <>
      <SeoHead
        title="Administrator Sign In | Ib home light property and land"
        description="Protected administrator portal for Ib home light property and land."
      />
      <div className="min-h-screen bg-[#101C32] flex flex-col justify-center px-4 py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#D6AD32] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Public Website</span>
            </Link>
          </div>

          <div className="bg-white rounded-sm border border-[#D6AD32]/40 p-7 sm:p-9 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-sm bg-[#101C32] flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-[#D6AD32]" strokeWidth={1.7} />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-[#101C32] leading-tight">
                  Administrator Sign In
                </h1>
                <p className="text-xs text-[#202020]/65 mt-0.5">
                  Ib home light property and land
                </p>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-sm text-xs font-medium text-red-800"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/20 rounded-sm text-[#101C32] focus:outline-none focus:border-[#D6AD32]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101C32] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#F8F7F3] border border-[#101C32]/20 rounded-sm text-[#101C32] focus:outline-none focus:border-[#D6AD32]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#101C32]/60 hover:text-[#101C32]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-[#101C32] bg-[#D6AD32] hover:bg-[#B58F21] hover:text-white rounded-sm transition-colors disabled:opacity-60 mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sign In to Dashboard</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
