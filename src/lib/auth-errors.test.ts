import { humaniseError } from "@/lib/auth-errors";

describe("humaniseError", () => {
  it("humanises 'invalid credentials' message", () => {
    expect(humaniseError("Invalid login credentials")).toBe(
      "Incorrect email or password.",
    );
  });

  it("humanises 'invalid credentials' message (lowercase)", () => {
    expect(humaniseError("invalid credentials")).toBe(
      "Incorrect email or password.",
    );
  });

  it("humanises 'user already registered' message", () => {
    expect(humaniseError("User already registered")).toBe(
      "An account already exists with this email.",
    );
  });

  it("humanises 'already registered' message", () => {
    expect(humaniseError("Email already registered")).toBe(
      "An account already exists with this email.",
    );
  });

  it("humanises password length message", () => {
    expect(humaniseError("password must be at least 8 characters")).toBe(
      "Password must be at least 8 characters.",
    );
  });

  it("humanises invalid email message", () => {
    expect(humaniseError("invalid email")).toBe(
      "Please enter a valid email address.",
    );
  });

  it("humanises rate limit / too many attempts message", () => {
    expect(humaniseError("too many requests")).toBe(
      "Too many attempts. Please try again later.",
    );
  });

  it("returns a generic message for unknown errors", () => {
    expect(humaniseError("Something went wrong")).toBe(
      "An unexpected error occurred. Please try again.",
    );
  });

  it("returns a generic message for generic errors", () => {
    expect(humaniseError("Connection refused")).toBe(
      "An unexpected error occurred. Please try again.",
    );
  });

  it("humanises 'refresh token has expired' message", () => {
    expect(humaniseError("Refresh token has expired")).toBe(
      "Your session has expired. Please sign in again.",
    );
  });

  it("humanises 'invalid refresh token' message", () => {
    expect(humaniseError("Invalid refresh token")).toBe(
      "Your session has expired. Please sign in again.",
    );
  });

  it("humanises 'current password is incorrect' message", () => {
    expect(humaniseError("Current password is incorrect")).toBe(
      "Your current password is incorrect.",
    );
  });

  it("humanises 'invalid or expired reset token' message", () => {
    expect(humaniseError("Invalid or expired reset token")).toBe(
      "This password reset link is invalid or has expired. Please request a new one.",
    );
  });

  it("humanises 'captcha verification failed' message", () => {
    expect(humaniseError("Captcha verification failed: invalid-input")).toBe(
      "Security verification failed. Please try again.",
    );
  });

  it("humanises 'validation failed' message", () => {
    expect(humaniseError("Validation failed")).toBe(
      "Please check your input and try again.",
    );
  });
});
