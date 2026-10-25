import { authClient } from "@/features/auth/lib/auth-client";
import { AuthService } from "@/features/auth/services/auth.service";

jest.mock("@/features/auth/lib/auth-client", () => ({
  authClient: {
    signIn: { email: jest.fn() },
    signUp: { email: jest.fn() },
    signOut: jest.fn(),
    changePassword: jest.fn(),
    getSession: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
  },
}));

const mockSignInEmail = authClient.signIn.email as unknown as jest.Mock;
const mockSignUpEmail = authClient.signUp.email as unknown as jest.Mock;
const mockSignOut = authClient.signOut as unknown as jest.Mock;
const mockChangePassword = authClient.changePassword as unknown as jest.Mock;
const mockGetSession = authClient.getSession as unknown as jest.Mock;
const mockRequestPasswordReset =
  authClient.requestPasswordReset as unknown as jest.Mock;
const mockResetPassword = authClient.resetPassword as unknown as jest.Mock;

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  defaultCurrency: "PHP",
};

describe("authService", () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe("signIn", () => {
    it("calls authClient.signIn.email and returns user on success", async () => {
      mockSignInEmail.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      const result = await authService.signIn({
        email: "test@example.com",
        password: "secret123",
      });

      expect(mockSignInEmail).toHaveBeenCalledWith(
        { email: "test@example.com", password: "secret123" },
        { headers: undefined },
      );
      expect(result).toEqual(mockUser);
    });

    it("passes the turnstile token as X-Captcha-Response header", async () => {
      mockSignInEmail.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      await authService.signIn({
        email: "test@example.com",
        password: "secret123",
        turnstileToken: "token-123",
      });

      expect(mockSignInEmail).toHaveBeenCalledWith(
        { email: "test@example.com", password: "secret123" },
        { headers: { "X-Captcha-Response": "token-123" } },
      );
    });

    it("throws on failure", async () => {
      mockSignInEmail.mockResolvedValue({
        data: null,
        error: { message: "Invalid email or password" },
      });

      await expect(
        authService.signIn({ email: "test@example.com", password: "wrong" }),
      ).rejects.toThrow("Invalid email or password");
    });
  });

  describe("signUp", () => {
    it("calls authClient.signUp.email and returns user on success", async () => {
      mockSignUpEmail.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      const result = await authService.signUp({
        email: "test@example.com",
        password: "secret123",
        name: "Test",
      });

      expect(mockSignUpEmail).toHaveBeenCalledWith(
        {
          email: "test@example.com",
          password: "secret123",
          name: "Test",
        },
        { headers: undefined },
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe("signOut", () => {
    it("calls authClient.signOut", async () => {
      mockSignOut.mockResolvedValue({ data: { success: true }, error: null });

      await authService.signOut();

      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe("changePassword", () => {
    it("calls authClient.changePassword with body", async () => {
      mockChangePassword.mockResolvedValue({
        data: { status: true },
        error: null,
      });

      await authService.changePassword({
        currentPassword: "old",
        newPassword: "new123",
      });

      expect(mockChangePassword).toHaveBeenCalledWith({
        currentPassword: "old",
        newPassword: "new123",
      });
    });
  });

  describe("getCurrentUser", () => {
    it("calls authClient.getSession and returns user", async () => {
      mockGetSession.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      const result = await authService.getCurrentUser();

      expect(mockGetSession).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it("returns null when not authenticated", async () => {
      mockGetSession.mockResolvedValue({ data: null, error: null });

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe("forgotPassword", () => {
    it("calls authClient.requestPasswordReset", async () => {
      mockRequestPasswordReset.mockResolvedValue({
        data: { status: true },
        error: null,
      });

      await authService.forgotPassword({ email: "test@example.com" });

      expect(mockRequestPasswordReset).toHaveBeenCalledWith(
        { email: "test@example.com" },
        { headers: undefined },
      );
    });
  });

  describe("resetPassword", () => {
    it("calls authClient.resetPassword", async () => {
      mockResetPassword.mockResolvedValue({
        data: { status: true },
        error: null,
      });

      await authService.resetPassword({
        token: "reset-token",
        newPassword: "NewPassword123",
      });

      expect(mockResetPassword).toHaveBeenCalledWith({
        newPassword: "NewPassword123",
        token: "reset-token",
      });
    });
  });
});
