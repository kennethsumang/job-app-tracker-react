import { ForgotPasswordValidator } from "@/features/auth/validators/forgot-password.validator";

describe("ForgotPasswordValidator", () => {
  let validator: ForgotPasswordValidator;

  beforeEach(() => {
    validator = new ForgotPasswordValidator();
  });

  it("accepts a valid email", () => {
    // Arrange
    const input = { email: "user@example.com" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual({
      success: true,
      data: input,
      errors: null,
    });
  });

  it("rejects an empty email", () => {
    // Arrange
    const input = { email: "" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          email: expect.arrayContaining(["Email is required."]),
        }),
      }),
    );
  });

  it("rejects an invalid email format", () => {
    // Arrange
    const input = { email: "not-an-email" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          email: expect.arrayContaining(["Enter a valid email address."]),
        }),
      }),
    );
  });
});
