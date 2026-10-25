import type { AuthUser } from "@/features/auth/types";
import { useAuthStore } from "@/features/auth/store/auth.store";

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  defaultCurrency: "PHP",
} as AuthUser;

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  it("has the expected initial state", () => {
    // Arrange & Act
    const state = useAuthStore.getState();

    // Assert
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(true);
  });

  it("setUser stores the user and marks the session authenticated", () => {
    // Arrange
    const { setUser } = useAuthStore.getState();

    // Act
    setUser(mockUser);

    // Assert
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it("setUser(null) clears the user and auth flag", () => {
    // Arrange
    useAuthStore.getState().setUser(mockUser);

    // Act
    useAuthStore.getState().setUser(null);

    // Assert
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("clearSession resets the user and auth flag", () => {
    // Arrange
    useAuthStore.getState().setUser(mockUser);

    // Act
    useAuthStore.getState().clearSession();

    // Assert
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("setLoading updates the loading flag", () => {
    // Arrange
    const { setLoading } = useAuthStore.getState();

    // Act
    setLoading(false);

    // Assert
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
