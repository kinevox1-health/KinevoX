/**
 * KinevoX — Profile Page
 *
 * User profile page showing:
 * - Avatar and display name
 * - Account info (email, provider)
 * - Fitness preferences summary
 * - Stats overview
 * - Sign out button
 * - Data management (export/clear)
 */

import { useState } from 'react';
import {
  User,
  Mail,
  LogOut,
  Shield,
  Dumbbell,
  Target,
  Calendar,
  Clock3,
  MapPin,
  TrendingUp,
  Trash2,
  Download,
  ChevronRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { Lang, Preferences, WorkoutLog, WorkoutSession } from '../data/types';
import { Link } from 'wouter';

/* ── Bilingual copy ─────────────────────────────────────────── */

const profileCopy: Record<string, Record<Lang, string>> = {
  profileTitle: { en: 'Your Profile', ar: 'ملفك الشخصي' },
  profileSubtitle: { en: 'Manage your account and preferences.', ar: 'أدِر حسابك وتفضيلاتك.' },
  accountSection: { en: 'Account', ar: 'الحساب' },
  fitnessSection: { en: 'Fitness Profile', ar: 'الملف الرياضي' },
  statsSection: { en: 'Statistics', ar: 'الإحصائيات' },
  dataSection: { en: 'Data & Privacy', ar: 'البيانات والخصوصية' },
  signOut: { en: 'Sign Out', ar: 'تسجيل الخروج' },
  signOutConfirm: { en: 'Are you sure you want to sign out?', ar: 'هل أنت متأكد من تسجيل الخروج؟' },
  provider: { en: 'Sign-in method', ar: 'طريقة تسجيل الدخول' },
  providerEmail: { en: 'Email & Password', ar: 'بريد إلكتروني وكلمة مرور' },
  providerGoogle: { en: 'Google', ar: 'Google' },
  providerApple: { en: 'Apple', ar: 'Apple' },
  memberSince: { en: 'Member since', ar: 'عضو منذ' },
  goal: { en: 'Goal', ar: 'الهدف' },
  goalGetMoving: { en: 'Move more often', ar: 'زيادة الحركة' },
  goalBuildStrength: { en: 'Build everyday strength', ar: 'بناء قوة يومية' },
  goalFeelMobile: { en: 'Feel more mobile', ar: 'مرونة وحركة أسهل' },
  experience: { en: 'Experience', ar: 'الخبرة' },
  expNew: { en: 'New to routines', ar: 'جديد على الروتين' },
  expSome: { en: 'Some experience', ar: 'لدي تجربة سابقة' },
  location: { en: 'Preferred location', ar: 'المكان المفضل' },
  locHome: { en: 'At home', ar: 'في المنزل' },
  locOutdoors: { en: 'Outdoors', ar: 'في الخارج' },
  locGym: { en: 'At a gym', ar: 'في النادي' },
  equipment: { en: 'Equipment', ar: 'المعدات' },
  equipNone: { en: 'No equipment', ar: 'دون معدات' },
  equipBasic: { en: 'Basic (band / light weights)', ar: 'أساسية (شريط / أوزان خفيفة)' },
  equipGym: { en: 'Full gym', ar: 'نادي رياضي كامل' },
  daysPerWeek: { en: 'Days per week', ar: 'أيام في الأسبوع' },
  sessionLength: { en: 'Session length', ar: 'مدة الجلسة' },
  minutesUnit: { en: 'min', ar: 'دقيقة' },
  totalSessions: { en: 'Total sessions', ar: 'إجمالي الجلسات' },
  totalMinutes: { en: 'Total minutes', ar: 'إجمالي الدقائق' },
  thisWeek: { en: 'This week', ar: 'هذا الأسبوع' },
  editPreferences: { en: 'Edit preferences', ar: 'تعديل التفضيلات' },
  exportData: { en: 'Export my data', ar: 'تصدير بياناتي' },
  clearData: { en: 'Clear all local data', ar: 'مسح كل البيانات المحلية' },
  clearConfirm: { en: 'This will remove all your local data. Cloud data will remain.', ar: 'سيؤدي هذا إلى حذف جميع بياناتك المحلية. ستبقى البيانات السحابية.' },
  privacyLink: { en: 'Privacy & data policy', ar: 'سياسة الخصوصية والبيانات' },
  noPrefs: { en: 'No preferences set yet', ar: 'لم يتم تعيين تفضيلات بعد' },
  setupPrefs: { en: 'Set up your fitness profile', ar: 'أعدّ ملفك الرياضي' },
  guestBadge: { en: 'Guest Mode', ar: 'وضع الزائر' },
  guestMessage: { en: 'Sign in to sync your data across devices.', ar: 'سجّل الدخول لمزامنة بياناتك عبر الأجهزة.' },
  signInPrompt: { en: 'Sign In', ar: 'تسجيل الدخول' },
  cloudSynced: { en: 'Synced to cloud', ar: 'متزامن مع السحابة' },
  localOnly: { en: 'Saved locally only', ar: 'محفوظ محلياً فقط' },
};

/* ── Component ──────────────────────────────────────────────── */

interface ProfilePageProps {
  lang: Lang;
  preferences: Preferences | null;
  logs: WorkoutLog[];
  sessions: WorkoutSession[];
  onClearData: () => void;
}

export function ProfilePage({ lang, preferences, logs, sessions, onClearData }: ProfilePageProps) {
  const { user, profile, logout, isFirebaseConfigured } = useAuth();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const t = (key: string) => profileCopy[key]?.[lang] ?? key;
  const isGuest = !user;

  // Stats
  const totalSessions = logs.length;
  const weekCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyCount = logs.filter((l) => new Date(l.date).getTime() >= weekCutoff).length;
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.totalMinutes || 0), 0);

  // Provider info
  const getProviderName = () => {
    if (!user) return '';
    const providerId = user.providerData[0]?.providerId;
    if (providerId === 'google.com') return t('providerGoogle');
    if (providerId === 'apple.com') return t('providerApple');
    return t('providerEmail');
  };

  // Goal label
  const goalLabel = preferences?.goal === 'get-moving' ? t('goalGetMoving')
    : preferences?.goal === 'build-strength' ? t('goalBuildStrength')
    : preferences?.goal === 'feel-mobile' ? t('goalFeelMobile')
    : '';

  // Location label
  const locationLabel = preferences?.location === 'home' ? t('locHome')
    : preferences?.location === 'outdoors' ? t('locOutdoors')
    : preferences?.location === 'gym' ? t('locGym')
    : '';

  // Equipment label
  const equipLabel = preferences?.equipment === 'none' ? t('equipNone')
    : preferences?.equipment === 'basic' ? t('equipBasic')
    : preferences?.equipment === 'gym' ? t('equipGym')
    : '';

  const handleExport = () => {
    const exportData = {
      profile: profile || null,
      preferences,
      logs,
      sessions,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kinevox-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSignOut = async () => {
    await logout();
    setShowSignOutConfirm(false);
  };

  const handleClearData = () => {
    onClearData();
    setShowClearConfirm(false);
  };

  return (
    <div className="profile-page animate-in">
      <div className="page-head">
        <h1 className="page-title">{t('profileTitle')}</h1>
        <p className="page-subtitle">{t('profileSubtitle')}</p>
      </div>

      {/* ── Guest banner ────────────────────────────────────── */}
      {isGuest && isFirebaseConfigured && (
        <div className="profile-guest-banner">
          <div className="profile-guest-badge">{t('guestBadge')}</div>
          <p>{t('guestMessage')}</p>
          <Link href="/auth" className="button primary small" data-testid="link-profile-signin">
            {t('signInPrompt')}
            <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* ── Account section ─────────────────────────────────── */}
      {user && (
        <section className="profile-section">
          <h2 className="profile-section-title">{t('accountSection')}</h2>
          <div className="profile-card">
            <div className="profile-avatar-row">
              <div className="profile-avatar">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
                ) : (
                  <User size={28} />
                )}
              </div>
              <div className="profile-info">
                <h3 className="profile-name">{user.displayName || profile?.displayName || ''}</h3>
                <div className="profile-detail">
                  <Mail size={14} />
                  <span>{user.email}</span>
                </div>
                <div className="profile-detail">
                  <Shield size={14} />
                  <span>{t('provider')}: {getProviderName()}</span>
                </div>
                {user.metadata.creationTime && (
                  <div className="profile-detail">
                    <Calendar size={14} />
                    <span>{t('memberSince')} {new Date(user.metadata.creationTime).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="profile-sync-status">
              <CheckCircle2 size={14} />
              <span>{t('cloudSynced')}</span>
            </div>
          </div>
        </section>
      )}

      {isGuest && (
        <section className="profile-section">
          <h2 className="profile-section-title">{t('accountSection')}</h2>
          <div className="profile-card">
            <div className="profile-avatar-row">
              <div className="profile-avatar guest">
                <User size={28} />
              </div>
              <div className="profile-info">
                <h3 className="profile-name">{t('guestBadge')}</h3>
                <div className="profile-sync-status local">
                  <Shield size={14} />
                  <span>{t('localOnly')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Fitness profile section ─────────────────────────── */}
      <section className="profile-section">
        <div className="profile-section-header">
          <h2 className="profile-section-title">{t('fitnessSection')}</h2>
          {preferences && (
            <Link href="/onboarding" className="profile-edit-link" data-testid="link-profile-edit-prefs">
              {t('editPreferences')}
              <ChevronRight size={14} />
            </Link>
          )}
        </div>
        {preferences ? (
          <div className="profile-card">
            <div className="profile-prefs-grid">
              <div className="profile-pref-item">
                <Target size={16} />
                <div>
                  <span className="profile-pref-label">{t('goal')}</span>
                  <span className="profile-pref-value">{goalLabel}</span>
                </div>
              </div>
              <div className="profile-pref-item">
                <TrendingUp size={16} />
                <div>
                  <span className="profile-pref-label">{t('experience')}</span>
                  <span className="profile-pref-value">{preferences.experience === 'new' ? t('expNew') : t('expSome')}</span>
                </div>
              </div>
              <div className="profile-pref-item">
                <MapPin size={16} />
                <div>
                  <span className="profile-pref-label">{t('location')}</span>
                  <span className="profile-pref-value">{locationLabel}</span>
                </div>
              </div>
              <div className="profile-pref-item">
                <Dumbbell size={16} />
                <div>
                  <span className="profile-pref-label">{t('equipment')}</span>
                  <span className="profile-pref-value">{equipLabel}</span>
                </div>
              </div>
              <div className="profile-pref-item">
                <Calendar size={16} />
                <div>
                  <span className="profile-pref-label">{t('daysPerWeek')}</span>
                  <span className="profile-pref-value">{preferences.daysPerWeek}</span>
                </div>
              </div>
              <div className="profile-pref-item">
                <Clock3 size={16} />
                <div>
                  <span className="profile-pref-label">{t('sessionLength')}</span>
                  <span className="profile-pref-value">{preferences.sessionMinutes} {t('minutesUnit')}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="profile-card empty">
            <p>{t('noPrefs')}</p>
            <Link href="/onboarding" className="button outline small" data-testid="link-profile-setup">
              {t('setupPrefs')}
              <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </section>

      {/* ── Stats section ───────────────────────────────────── */}
      <section className="profile-section">
        <h2 className="profile-section-title">{t('statsSection')}</h2>
        <div className="profile-stats-grid">
          <div className="profile-stat-card">
            <strong>{totalSessions}</strong>
            <span>{t('totalSessions')}</span>
          </div>
          <div className="profile-stat-card">
            <strong>{totalMinutes}</strong>
            <span>{t('totalMinutes')}</span>
          </div>
          <div className="profile-stat-card">
            <strong>{weeklyCount}</strong>
            <span>{t('thisWeek')}</span>
          </div>
        </div>
      </section>

      {/* ── Data & Privacy section ──────────────────────────── */}
      <section className="profile-section">
        <h2 className="profile-section-title">{t('dataSection')}</h2>
        <div className="profile-card">
          <div className="profile-actions">
            <button
              type="button"
              className="profile-action-btn"
              onClick={handleExport}
              data-testid="button-profile-export"
            >
              <Download size={16} />
              {t('exportData')}
            </button>
            <Link href="/privacy" className="profile-action-btn" data-testid="link-profile-privacy">
              <Shield size={16} />
              {t('privacyLink')}
              <ChevronRight size={14} style={{ marginInlineStart: 'auto' }} />
            </Link>
            <button
              type="button"
              className="profile-action-btn danger"
              onClick={() => setShowClearConfirm(true)}
              data-testid="button-profile-clear"
            >
              <Trash2 size={16} />
              {t('clearData')}
            </button>
          </div>
        </div>
      </section>

      {/* ── Sign out ────────────────────────────────────────── */}
      {user && (
        <div className="profile-signout-section">
          {!showSignOutConfirm ? (
            <button
              type="button"
              className="profile-signout-btn"
              onClick={() => setShowSignOutConfirm(true)}
              data-testid="button-profile-signout"
            >
              <LogOut size={16} />
              {t('signOut')}
            </button>
          ) : (
            <div className="profile-confirm-bar">
              <p>{t('signOutConfirm')}</p>
              <div className="profile-confirm-actions">
                <button type="button" className="button outline small" onClick={() => setShowSignOutConfirm(false)}>
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="button" className="button primary small danger" onClick={handleSignOut}>
                  {t('signOut')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Clear data confirm modal ────────────────────────── */}
      {showClearConfirm && (
        <div className="profile-modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <Trash2 size={24} className="profile-modal-icon danger" />
            <h3>{t('clearData')}</h3>
            <p>{t('clearConfirm')}</p>
            <div className="profile-modal-actions">
              <button type="button" className="button outline" onClick={() => setShowClearConfirm(false)}>
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button type="button" className="button primary danger" onClick={handleClearData}>
                {t('clearData')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
