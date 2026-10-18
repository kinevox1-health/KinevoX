/**
 * KinevoX — Auth Context
 *
 * Provides authentication state to the entire app.
 * Handles:
 * - Auth state observation (auto-login persistence)
 * - Loading state while Firebase initializes
 * - User profile data from Firestore
 * - Data sync between localStorage and Firestore on auth changes
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';
import {
  onAuthChange,
  signOut,
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signInWithApple,
  resetPassword,
} from '../services/authService';
import {
  createUserProfile,
  getUserProfile,
  getUserData,
  saveUserData,
  mergeLocalAndCloudData,
  type UserProfile,
  type UserCloudData,
} from '../services/firestoreService';
import { readStoredData, persistStorageData } from '../services/storageService';
import type { Lang } from '../data/types';

/* ── Types ──────────────────────────────────────────────────── */

export interface AuthState {
  /** Firebase user object, null when not logged in */
  user: User | null;
  /** User profile from Firestore */
  profile: UserProfile | null;
  /** True while Firebase is checking initial auth state */
  loading: boolean;
  /** True while performing auth operations */
  authLoading: boolean;
  /** Last auth error message */
  error: string | null;
  /** Whether the user has an active Firebase config */
  isFirebaseConfigured: boolean;
}

export interface AuthActions {
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerEmail: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  clearError: () => void;
}

export type AuthContextValue = AuthState & AuthActions;

/* ── Context ────────────────────────────────────────────────── */

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/* ── Helper: check if Firebase is configured ────────────────── */

function checkFirebaseConfigured(): boolean {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  return !!apiKey && apiKey !== '' && apiKey !== 'undefined';
}

/* ── Provider ───────────────────────────────────────────────── */

interface AuthProviderProps {
  children: ReactNode;
  onSyncFromCloud?: (data: UserCloudData) => void;
}

export function AuthProvider({ children, onSyncFromCloud }: AuthProviderProps) {
  const isFirebaseConfigured = checkFirebaseConfigured();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Load or create profile
          let userProfile = await getUserProfile(firebaseUser.uid);
          if (!userProfile) {
            // First sign-in: create profile from Firebase Auth data
            const newProfile = {
              displayName: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || null,
            };
            await createUserProfile(firebaseUser.uid, newProfile);
            userProfile = await getUserProfile(firebaseUser.uid);
          }
          setProfile(userProfile);

          // Sync data: merge local with cloud
          const localStorageData = readStoredData();
          const localData: UserCloudData = {
            language: localStorageData.language,
            preferences: localStorageData.preferences,
            activePlan: localStorageData.activePlan,
            logs: localStorageData.logs,
            sessions: localStorageData.sessions,
          };

          const cloudData = await getUserData(firebaseUser.uid);
          const merged = mergeLocalAndCloudData(localData, cloudData);

          // Save merged data back to cloud
          await saveUserData(firebaseUser.uid, merged);

          // Update local storage with merged data
          persistStorageData({
            schemaVersion: 2,
            language: merged.language,
            preferences: merged.preferences,
            activePlan: merged.activePlan,
            logs: merged.logs,
            sessions: merged.sessions,
            activeSession: localStorageData.activeSession,
          });

          // Notify parent to update app state
          if (onSyncFromCloud) {
            onSyncFromCloud(merged);
          }
        } catch (err) {
          console.error('[KinevoX] Error syncing user data:', err);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [isFirebaseConfigured, onSyncFromCloud]);

  /* ── Auth actions ──────────────────────────────────────────── */

  const handleAuthError = useCallback((err: unknown) => {
    const firebaseError = err as { code?: string; message?: string };
    const code = firebaseError.code || '';

    const errorMessages: Record<string, Record<Lang, string>> = {
      'auth/email-already-in-use': {
        en: 'This email is already registered. Try signing in.',
        ar: 'هذا البريد مسجل بالفعل. جرّب تسجيل الدخول.',
      },
      'auth/invalid-email': {
        en: 'Please enter a valid email address.',
        ar: 'يرجى إدخال بريد إلكتروني صحيح.',
      },
      'auth/weak-password': {
        en: 'Password must be at least 6 characters.',
        ar: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.',
      },
      'auth/wrong-password': {
        en: 'Incorrect password. Try again or reset it.',
        ar: 'كلمة المرور غير صحيحة. حاول مجدداً أو أعد تعيينها.',
      },
      'auth/user-not-found': {
        en: 'No account found with this email.',
        ar: 'لا يوجد حساب بهذا البريد الإلكتروني.',
      },
      'auth/too-many-requests': {
        en: 'Too many attempts. Please wait and try again.',
        ar: 'محاولات كثيرة جداً. يرجى الانتظار والمحاولة لاحقاً.',
      },
      'auth/popup-closed-by-user': {
        en: 'Sign-in cancelled.',
        ar: 'تم إلغاء تسجيل الدخول.',
      },
      'auth/invalid-credential': {
        en: 'Invalid email or password.',
        ar: 'بريد إلكتروني أو كلمة مرور غير صحيحة.',
      },
    };

    // Detect current language from localStorage
    const lang = (localStorage.getItem('kinevox-lang') as Lang) || 'en';
    const msg = errorMessages[code]?.[lang] || firebaseError.message || 'Authentication error';
    setError(msg);
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    setAuthLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      handleAuthError(err);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  }, [handleAuthError]);

  const registerEmail = useCallback(async (email: string, password: string, name: string) => {
    setError(null);
    setAuthLoading(true);
    try {
      await registerWithEmail(email, password, name);
    } catch (err) {
      handleAuthError(err);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  }, [handleAuthError]);

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      handleAuthError(err);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  }, [handleAuthError]);

  const loginWithApple = useCallback(async () => {
    setError(null);
    setAuthLoading(true);
    try {
      await signInWithApple();
    } catch (err) {
      handleAuthError(err);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  }, [handleAuthError]);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await signOut();
      setProfile(null);
    } catch (err) {
      handleAuthError(err);
    }
  }, [handleAuthError]);

  const sendPasswordReset = useCallback(async (email: string) => {
    setError(null);
    setAuthLoading(true);
    try {
      await resetPassword(email);
    } catch (err) {
      handleAuthError(err);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  }, [handleAuthError]);

  const clearError = useCallback(() => setError(null), []);

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    authLoading,
    error,
    isFirebaseConfigured,
    loginWithEmail,
    registerEmail,
    loginWithGoogle,
    loginWithApple,
    logout,
    sendPasswordReset,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
