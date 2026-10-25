import { SignUpValidator } from "@/features/auth/validators/sign-up.validator";

describe("SignUpValidator", () => {
  let validator: SignUpValidator;

  beforeEach(() => {
    validator = new SignUpValidator();
  });

  it("accepts valid registration data", () => {
    // Arrange
    const input = {
      email: "user@example.com",
      name: "Test User",
      password: "secret123",
      confirmPassword: "secret123",
    };

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
    const input = {
      email: "",
      name: "Test User",
      password: "secret123",
      confirmPassword: "secret123",
    };

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
    const input = {
      email: "not-an-email",
      name: "Test User",
      password: "secret123",
      confirmPassword: "secret123",
    };

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

  it("rejects an empty name", () => {
    // Arrange
    const input = {
      email: "user@example.com",
      name: "   ",
      password: "secret123",
      confirmPassword: "secret123",
    };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          name: expect.arrayContaining(["Name is required."]),
        }),
      }),
    );
  });

  it("rejects a name longer than 128 characters", () => {
    // Arrange
    const input = {
      email: "user@example.com",
      name: "a".repeat(129),
      password: "secret123",
      confirmPassword: "secret123",
    };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          name: expect.arrayContaining(["Name must be 128 characters or fewer."]),
        }),
      }),
    );
  });

  it("rejects an empty password", () => {
    // Arrange
    const input = {
      email: "user@example.com",
      name: "Test User",
      password: "",
      confirmPassword: "",
    };

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
    const input = {
      email: "user@example.com",
      name: "Test User",
      password: "short",
      confirmPassword: "short",
    };

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

  it("rejects mismatching passwords", () => {
    // Arrange
    const input = {
      email: "user@example.com",
      name: "Test User",
      password: "secret123",
      confirmPassword: "different",
    };

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
