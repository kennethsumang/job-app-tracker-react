import {
  type ChangePasswordInput,
  ChangePasswordValidator
} from "@/features/app/features/settings/validators/change-password.validator";

const validInput: ChangePasswordInput = {
  currentPassword: "OldPassword123!",
  newPassword: "NewPassword456!",
  confirmPassword: "NewPassword456!"
};

describe("ChangePasswordValidator", () => {
  let validator: ChangePasswordValidator;

  beforeEach(() => {
    validator = new ChangePasswordValidator();
  });

  it("accepts a valid change-password form", () => {
    // Arrange
    const input = { ...validInput };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual({ success: true, data: input, errors: null });
  });

  it("rejects a blank current password", () => {
    // Arrange
    const input = { ...validInput, currentPassword: "" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          currentPassword: expect.arrayContaining([
            "Enter your current password."
          ])
        })
      })
    );
  });

  it("rejects a blank new password", () => {
    // Arrange
    const input = { ...validInput, newPassword: "", confirmPassword: "" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          newPassword: expect.arrayContaining(["Enter a new password."])
        })
      })
    );
  });

  it("rejects a new password shorter than 8 characters", () => {
    // Arrange
    const input = { ...validInput, newPassword: "Short1!", confirmPassword: "Short1!" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          newPassword: expect.arrayContaining([
            "Password must be at least 8 characters."
          ])
        })
      })
    );
  });

  it("rejects a new password equal to the current password", () => {
    // Arrange
    const input = {
      ...validInput,
      newPassword: validInput.currentPassword,
      confirmPassword: validInput.currentPassword
    };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          newPassword: expect.arrayContaining([
            "New password must differ from current password."
          ])
        })
      })
    );
  });

  it("rejects a blank confirmation", () => {
    // Arrange
    const input = { ...validInput, confirmPassword: "" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          confirmPassword: expect.arrayContaining([
            "Please confirm your new password."
          ])
        })
      })
    );
  });

  it("rejects a confirmation that does not match the new password", () => {
    // Arrange
    const input = { ...validInput, confirmPassword: "Different456!" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          confirmPassword: expect.arrayContaining(["Passwords do not match."])
        })
      })
    );
  });
});
