/**
 * KinevoX — Auth Page
 *
 * Combined Login / Register page with:
 * - Email/Password form
 * - Google Sign-In button
 * - Apple Sign-In button
 * - Password reset flow
 * - Bilingual support (EN/AR)
 */

import { useState, type FormEvent } from 'react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { Lang } from '../data/types';

/* ── Bilingual copy ─────────────────────────────────────────── */

const authCopy: Record<string, Record<Lang, string>> = {
  signIn: { en: 'Sign In', ar: 'تسجيل الدخول' },
  signUp: { en: 'Create Account', ar: 'إنشاء حساب' },
  switchToSignUp: { en: "Don't have an account?", ar: 'ليس لديك حساب؟' },
  switchToSignIn: { en: 'Already have an account?', ar: 'لديك حساب بالفعل؟' },
  email: { en: 'Email address', ar: 'البريد الإلكتروني' },
  password: { en: 'Password', ar: 'كلمة المرور' },
  confirmPassword: { en: 'Confirm password', ar: 'تأكيد كلمة المرور' },
  name: { en: 'Full name', ar: 'الاسم الكامل' },
  forgotPassword: { en: 'Forgot password?', ar: 'نسيت كلمة المرور؟' },
  resetPassword: { en: 'Reset Password', ar: 'إعادة تعيين كلمة المرور' },
  resetSent: { en: 'Password reset email sent! Check your inbox.', ar: 'تم إرسال رابط إعادة التعيين! تحقق من بريدك الإلكتروني.' },
  backToSignIn: { en: 'Back to sign in', ar: 'العودة لتسجيل الدخول' },
  orContinueWith: { en: 'or continue with', ar: 'أو تابع بواسطة' },
  google: { en: 'Continue with Google', ar: 'المتابعة بحساب Google' },
  apple: { en: 'Continue with Apple', ar: 'المتابعة بحساب Apple' },
  welcomeTitle: { en: 'Welcome to KinevoX', ar: 'أهلاً بك في KinevoX' },
  welcomeSubtitle: { en: 'Your fitness journey, saved and synced.', ar: 'رحلتك الرياضية، محفوظة ومتزامنة.' },
  createTitle: { en: 'Join KinevoX', ar: 'انضم إلى KinevoX' },
  createSubtitle: { en: 'Start building your personalized fitness plan.', ar: 'ابدأ ببناء خطتك الرياضية المخصصة.' },
  resetTitle: { en: 'Reset your password', ar: 'أعد تعيين كلمة مرورك' },
  resetSubtitle: { en: "Enter your email and we'll send you a reset link.", ar: 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.' },
  passwordMismatch: { en: 'Passwords do not match.', ar: 'كلمتا المرور غير متطابقتين.' },
  passwordTooShort: { en: 'Password must be at least 6 characters.', ar: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.' },
  nameRequired: { en: 'Please enter your name.', ar: 'يرجى إدخال اسمك.' },
  guestMode: { en: 'Continue without account', ar: 'المتابعة بدون حساب' },
  guestHint: { en: 'Your data will be saved locally on this device only.', ar: 'ستُحفظ بياناتك محليًا على هذا الجهاز فقط.' },
};

/* ── Google SVG Icon ─────────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

/* ── Apple SVG Icon ──────────────────────────────────────────── */

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 22" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.94 11.566c-.025-2.56 2.09-3.79 2.184-3.852-1.19-1.74-3.043-1.978-3.703-2.005-1.575-.16-3.078.93-3.878.93-.8 0-2.036-.907-3.346-.883-1.722.025-3.31 1.003-4.197 2.547-1.79 3.104-.458 7.7 1.286 10.217.852 1.234 1.869 2.62 3.204 2.571 1.285-.051 1.771-.832 3.325-.832 1.554 0 1.99.832 3.347.806 1.383-.025 2.26-1.259 3.1-2.498.977-1.432 1.38-2.82 1.405-2.892-.031-.013-2.695-1.034-2.722-4.103zM12.424 3.791c.709-.86 1.187-2.054 1.057-3.245-1.021.042-2.261.68-2.994 1.539-.656.76-1.231 1.974-1.076 3.14 1.14.088 2.303-.58 3.013-1.434z"/>
    </svg>
  );
}

/* ── Component ──────────────────────────────────────────────── */

type AuthMode = 'login' | 'register' | 'reset';

interface AuthPageProps {
  lang: Lang;
  onGuestContinue: () => void;
}

export function AuthPage({ lang, onGuestContinue }: AuthPageProps) {
  const {
    loginWithEmail,
    registerEmail,
    loginWithGoogle,
    loginWithApple,
    sendPasswordReset,
    authLoading,
    error,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const t = (key: string) => authCopy[key]?.[lang] ?? key;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setLocalError(null);
    setResetSent(false);
    clearError();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (mode === 'reset') {
      try {
        await sendPasswordReset(email);
        setResetSent(true);
      } catch {
        // Error handled by context
      }
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setLocalError(t('nameRequired'));
        return;
      }
      if (password.length < 6) {
        setLocalError(t('passwordTooShort'));
        return;
      }
      if (password !== confirmPwd) {
        setLocalError(t('passwordMismatch'));
        return;
      }
      try {
        await registerEmail(email, password, name);
      } catch {
        // Error handled by context
      }
      return;
    }

    // Login
    try {
      await loginWithEmail(email, password);
    } catch {
      // Error handled by context
    }
  };

  const displayError = localError || error;

  return (
    <div className="auth-page animate-in" dir={dir}>
      <div className="auth-container">
        {/* ── Left panel: branding ──────────────────────────── */}
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="auth-logo">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="14" fill="rgba(255,255,255,0.15)"/>
                <path d="M14 24C14 18.477 18.477 14 24 14s10 4.477 10 10-4.477 10-10 10S14 29.523 14 24z" stroke="white" strokeWidth="2.5"/>
                <path d="M24 18v12M18 24h12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="auth-brand-title">KinevoX</h1>
            <p className="auth-brand-subtitle">
              {lang === 'ar' ? 'طوّر إمكاناتك' : 'Evolve Your Potential'}
            </p>
            <div className="auth-brand-features">
              <div className="auth-brand-feature">
                <CheckCircle2 size={16} />
                <span>{lang === 'ar' ? 'خطط تمارين مخصصة' : 'Personalized workout plans'}</span>
              </div>
              <div className="auth-brand-feature">
                <CheckCircle2 size={16} />
                <span>{lang === 'ar' ? 'تتبع تقدمك' : 'Track your progress'}</span>
              </div>
              <div className="auth-brand-feature">
                <CheckCircle2 size={16} />
                <span>{lang === 'ar' ? 'مزامنة عبر الأجهزة' : 'Sync across devices'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel: form ─────────────────────────────── */}
        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="auth-form-header">
              <h2 className="auth-form-title">
                {mode === 'reset' ? t('resetTitle') : mode === 'register' ? t('createTitle') : t('welcomeTitle')}
              </h2>
              <p className="auth-form-subtitle">
                {mode === 'reset' ? t('resetSubtitle') : mode === 'register' ? t('createSubtitle') : t('welcomeSubtitle')}
              </p>
            </div>

            {/* ── Social buttons ────────────────────────────── */}
            {mode !== 'reset' && (
              <>
                <div className="auth-social-buttons">
                  <button
                    type="button"
                    className="auth-social-btn google"
                    onClick={loginWithGoogle}
                    disabled={authLoading}
                    data-testid="button-auth-google"
                  >
                    <GoogleIcon />
                    <span>{t('google')}</span>
                  </button>
                  <button
                    type="button"
                    className="auth-social-btn apple"
                    onClick={loginWithApple}
                    disabled={authLoading}
                    data-testid="button-auth-apple"
                  >
                    <AppleIcon />
                    <span>{t('apple')}</span>
                  </button>
                </div>
                <div className="auth-divider">
                  <span>{t('orContinueWith')}</span>
                </div>
              </>
            )}

            {/* ── Error display ─────────────────────────────── */}
            {displayError && (
              <div className="auth-error" role="alert">
                <AlertCircle size={16} />
                <span>{displayError}</span>
              </div>
            )}

            {/* ── Reset success message ─────────────────────── */}
            {resetSent && (
              <div className="auth-success" role="status">
                <CheckCircle2 size={16} />
                <span>{t('resetSent')}</span>
              </div>
            )}

            {/* ── Form ──────────────────────────────────────── */}
            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <div className="auth-field">
                  <label htmlFor="auth-name">
                    <User size={16} />
                    {t('name')}
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('name')}
                    autoComplete="name"
                    required
                    data-testid="input-auth-name"
                  />
                </div>
              )}

              <div className="auth-field">
                <label htmlFor="auth-email">
                  <Mail size={16} />
                  {t('email')}
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('email')}
                  autoComplete="email"
                  required
                  data-testid="input-auth-email"
                />
              </div>

              {mode !== 'reset' && (
                <div className="auth-field">
                  <label htmlFor="auth-password">
                    <Lock size={16} />
                    {t('password')}
                  </label>
                  <div className="auth-password-wrapper">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('password')}
                      autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                      required
                      minLength={6}
                      data-testid="input-auth-password"
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <div className="auth-field">
                  <label htmlFor="auth-confirm-password">
                    <Lock size={16} />
                    {t('confirmPassword')}
                  </label>
                  <input
                    id="auth-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder={t('confirmPassword')}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    data-testid="input-auth-confirm-password"
                  />
                </div>
              )}

              {mode === 'login' && (
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => switchMode('reset')}
                  data-testid="button-auth-forgot"
                >
                  {t('forgotPassword')}
                </button>
              )}

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={authLoading}
                data-testid="button-auth-submit"
              >
                {authLoading ? (
                  <Loader2 size={18} className="auth-spinner" />
                ) : (
                  <>
                    {mode === 'reset' ? t('resetPassword') : mode === 'register' ? t('signUp') : t('signIn')}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* ── Mode toggle ───────────────────────────────── */}
            <div className="auth-mode-toggle">
              {mode === 'reset' ? (
                <button type="button" onClick={() => switchMode('login')}>
                  {t('backToSignIn')}
                </button>
              ) : mode === 'login' ? (
                <p>
                  {t('switchToSignUp')}{' '}
                  <button type="button" onClick={() => switchMode('register')} data-testid="button-auth-switch-register">
                    {t('signUp')}
                  </button>
                </p>
              ) : (
                <p>
                  {t('switchToSignIn')}{' '}
                  <button type="button" onClick={() => switchMode('login')} data-testid="button-auth-switch-login">
                    {t('signIn')}
                  </button>
                </p>
              )}
            </div>

            {/* ── Guest continue ─────────────────────────────── */}
            <div className="auth-guest-section">
              <button
                type="button"
                className="auth-guest-btn"
                onClick={onGuestContinue}
                data-testid="button-auth-guest"
              >
                {t('guestMode')}
              </button>
              <p className="auth-guest-hint">{t('guestHint')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
