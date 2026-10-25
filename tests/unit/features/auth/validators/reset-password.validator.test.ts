import { ResetPasswordValidator } from "@/features/auth/validators/reset-password.validator";

describe("ResetPasswordValidator", () => {
  let validator: ResetPasswordValidator;

  beforeEach(() => {
    validator = new ResetPasswordValidator();
  });

  it("accepts a complex matching password", () => {
    // Arrange
    const input = { password: "Password1", confirmPassword: "Password1" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual({
      success: true,
      data: input,
      errors: null,
    });
  });

  it("rejects an empty password", () => {
    // Arrange
    const input = { password: "", confirmPassword: "" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          password: expect.arrayContaining(["Password is required."]),
        }),
      }),
    );
  });

  it("rejects a password shorter than 8 characters", () => {
    // Arrange
    const input = { password: "short", confirmPassword: "short" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          password: expect.arrayContaining([
            "Password must be at least 8 characters.",
          ]),
        }),
      }),
    );
  });

  it("rejects a password missing required character classes", () => {
    // Arrange
    const input = { password: "alllowercase", confirmPassword: "alllowercase" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          password: expect.arrayContaining([
            "Password must contain uppercase, lowercase, and number.",
          ]),
        }),
      }),
    );
  });

  it("rejects mismatching passwords", () => {
    // Arrange
    const input = { password: "Password1", confirmPassword: "Password2" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          confirmPassword: expect.arrayContaining(["Passwords do not match."]),
        }),
      }),
    );
  });
});
