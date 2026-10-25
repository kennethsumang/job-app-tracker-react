import { create } from "zustand";
import type { AuthUser } from "@/features/auth/types";

/** Auth state consumed by route guards, auth pages, and the app shell. */
interface AuthState {
  /** Current session user, or null when signed out. */
  user: AuthUser | null;
  /** Derived flag kept in sync with `user`. */
  isAuthenticated: boolean;
  /** True until the initial session request settles. */
  isLoading: boolean;
  /** Stores the signed-in user. */
  setUser: (user: AuthUser | null) => void;
  /** Clears the user and authentication flag. */
  clearSession: () => void;
  /** Updates the session loading flag. */
  setLoading: (isLoading: boolean) => void;
}

/**
 * Global auth store backed by Zustand.
 *
 * Not persisted: better-auth owns the session cookie and `useAuthSession`
 * rehydrates the user on each app load.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  clearSession: () => set({ user: null, isAuthenticated: false }),

  setLoading: (isLoading) => set({ isLoading }),
}));
