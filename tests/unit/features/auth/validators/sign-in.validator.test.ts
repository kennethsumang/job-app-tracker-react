import { SignInValidator } from "@/features/auth/validators/sign-in.validator";

describe("SignInValidator", () => {
  let validator: SignInValidator;

  beforeEach(() => {
    validator = new SignInValidator();
  });

  it("accepts a valid email and password", () => {
    // Arrange
    const input = { email: "user@example.com", password: "secret123" };

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
    const input = { email: "   ", password: "secret123" };

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
    const input = { email: "not-an-email", password: "secret123" };

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

  it("rejects an empty password", () => {
    // Arrange
    const input = { email: "user@example.com", password: "" };

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
});
