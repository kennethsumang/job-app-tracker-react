import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type {
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  SignInPayload,
  SignUpPayload,
} from "@/features/auth/types";

const authService = new AuthService();

/** Signs a user in and stores the returned user. */
export function useSignIn() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation<AuthUser, Error, SignInPayload>({
    mutationFn: async (payload) => {
      const user = await authService.signIn(payload);
      setUser(user);
      return user;
    },
    throwOnError: false,
  });
}

/** Registers a user and stores the returned user. */
export function useSignUp() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation<AuthUser, Error, SignUpPayload>({
    mutationFn: async (payload) => {
      const user = await authService.signUp(payload);
      setUser(user);
      return user;
    },
    throwOnError: false,
  });
}

/** Signs the current user out and clears cached queries. */
export function useSignOut() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: async () => {
      await authService.signOut();
    },
    onSuccess: () => {
      clearSession();
      queryClient.removeQueries();
    },
    throwOnError: false,
  });
}

/** Changes the signed-in user's password. */
export function useChangePassword() {
  return useMutation<void, Error, ChangePasswordPayload>({
    mutationFn: async (payload) => {
      await authService.changePassword(payload);
    },
    throwOnError: false,
  });
}

/** Requests a password reset email. */
export function useForgotPassword() {
  return useMutation<void, Error, ForgotPasswordPayload>({
    mutationFn: async (payload) => {
      await authService.forgotPassword(payload);
    },
    throwOnError: false,
  });
}

/** Resets a password with an emailed token. */
export function useResetPassword() {
  return useMutation<void, Error, ResetPasswordPayload>({
    mutationFn: async (payload) => {
      await authService.resetPassword(payload);
    },
    throwOnError: false,
  });
}
