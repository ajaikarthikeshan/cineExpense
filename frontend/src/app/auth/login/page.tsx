'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import type { UserRole } from '@/types';

/* ─── Validation ──────────────────────────────────────────────────────── */
const loginSchema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

/* ─── Role → route map ────────────────────────────────────────────────── */
const ROLE_ROUTES: Record<UserRole, string> = {
  SUPERVISOR: '/dashboard/supervisor',
  MANAGER:    '/dashboard/manager',
  ACCOUNTS:   '/dashboard/accounts',
  PRODUCER:   '/dashboard/producer',
  ADMIN:      '/dashboard/producer',
};

/* ─── Inline SVG icons (no external library) ─────────────────────────── */
function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const router   = useRouter();
  const loginStore = useAuthStore((s) => s.login);

  const [showPassword, setShowPassword] = useState(false);
  const [serverError,  setServerError]  = useState('');
  const [loading,      setLoading]      = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
      const res = await axios.post(`${baseUrl}/auth/login`, data);
      const { access_token, user } = res.data;

      loginStore(access_token, user);

      console.log('Logged in role:', user.role);
      const dest = ROLE_ROUTES[user.role as UserRole] ?? '/dashboard/supervisor';
      router.push(dest);
    } catch {
      setServerError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">

      {/* ── Left — cinematic panel ──────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center relative overflow-hidden">

        {/* Diagonal gold accent lines */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute w-full h-px opacity-20"
            style={{
              top: '38%',
              background: 'linear-gradient(to right, transparent, var(--accent-gold), transparent)',
              transform: 'rotate(-14deg) scaleX(1.4)',
            }}
          />
          <div
            className="absolute w-full h-px opacity-10"
            style={{
              top: '44%',
              background: 'linear-gradient(to right, transparent, var(--accent-gold), transparent)',
              transform: 'rotate(-14deg) scaleX(1.4)',
            }}
          />
        </div>

        {/* Right-edge vertical separator */}
        <div
          className="absolute top-0 right-0 w-px h-full"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--gold-border), transparent)' }}
          aria-hidden="true"
        />

        {/* Brand content */}
        <div className="relative z-10 text-center px-16 select-none">
          <h1
            className="font-display font-semibold text-gold leading-none tracking-tight mb-6"
            style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)' }}
          >
            CineExpense<br />Pro
          </h1>
          <p
            className="text-muted font-sans uppercase tracking-[0.25em] text-sm"
          >
            Precision governance for every frame.
          </p>
        </div>

        {/* Footer attribution */}
        <p
          className="absolute bottom-8 left-8 text-muted font-sans"
          style={{ fontSize: '0.65rem', letterSpacing: '0.08em' }}
        >
          Powered by Five Star Creations
        </p>
      </div>

      {/* ── Right — login form ──────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 bg-surface flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-md">

          {/* Mobile wordmark */}
          <p className="lg:hidden font-display text-gold text-3xl font-semibold mb-8 text-center">
            CineExpense Pro
          </p>

          <h2
            className="font-display font-semibold mb-2"
            style={{ fontSize: '2.25rem', color: 'var(--text-primary)' }}
          >
            Sign in
          </h2>
          <p className="text-muted font-sans text-sm mb-10">
            Access your production workspace
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block font-sans text-sm mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@studio.com"
                {...register('email')}
                className={[
                  'w-full px-4 py-3 rounded font-sans text-sm',
                  'bg-primary border transition-colors duration-150',
                  'placeholder:text-muted',
                  'focus:outline-none focus:border-gold',
                  errors.email
                    ? 'border-danger'
                    : 'border-[var(--border)]',
                ].join(' ')}
                style={{ color: 'var(--text-primary)' }}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs font-sans text-danger">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block font-sans text-sm mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={[
                    'w-full px-4 py-3 pr-12 rounded font-sans text-sm',
                    'bg-primary border transition-colors duration-150',
                    'placeholder:text-muted',
                    'focus:outline-none focus:border-gold',
                    errors.password
                      ? 'border-danger'
                      : 'border-[var(--border)]',
                  ].join(' ')}
                  style={{ color: 'var(--text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-sans text-danger">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <p
                className="text-sm font-sans text-danger px-4 py-3 rounded border border-danger"
                style={{ background: 'rgba(153, 27, 27, 0.08)' }}
              >
                {serverError}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={[
                'w-full py-3.5 rounded font-sans font-medium text-sm',
                'bg-crimson hover:bg-crimson-hover',
                'transition-colors duration-150',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              ].join(' ')}
              style={{ color: '#fff' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>

          </form>
        </div>
      </div>

    </div>
  );
}
