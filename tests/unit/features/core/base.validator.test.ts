import { z } from "zod";
import { BaseValidator } from "@/features/core/base.validator";

interface TestInput {
  name: string;
  age: number;
}

class TestValidator extends BaseValidator<TestInput> {
  protected readonly schema = z.object({
    name: z.string().min(1, "Name is required."),
    age: z
      .number()
      .int("Age must be an integer.")
      .min(0, "Age must be non-negative."),
  });
}

interface NestedInput {
  profile: { email: string };
}

class NestedValidator extends BaseValidator<NestedInput> {
  protected readonly schema = z.object({
    profile: z.object({
      email: z.string().min(1, "Email is required."),
    }),
  });
}

interface MultiIssueInput {
  email: string;
}

class MultiIssueValidator extends BaseValidator<MultiIssueInput> {
  protected readonly schema = z.object({
    email: z
      .string()
      .refine((value) => value.trim().length > 0, {
        message: "Email is required.",
      })
      .refine((value) => /@/.test(value.trim()), {
        message: "Enter a valid email address.",
      }),
  });
}

describe("BaseValidator", () => {
  let validator: TestValidator;

  beforeEach(() => {
    validator = new TestValidator();
  });

  it("returns a success result with the parsed data for valid input", () => {
    // Arrange
    const input = { name: "Alice", age: 30 };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual({
      success: true,
      data: { name: "Alice", age: 30 },
      errors: null,
    });
  });

  it("maps each failing field to its error messages", () => {
    // Arrange
    const input = { name: "", age: -1 };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual({
      success: false,
      data: null,
      errors: {
        name: ["Name is required."],
        age: ["Age must be non-negative."],
      },
    });
  });

  it("collects multiple issues for the same field", () => {
    // Arrange
    const multipleIssuesValidator = new MultiIssueValidator();

    // Act
    const result = multipleIssuesValidator.validate({ email: " " });

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          email: expect.arrayContaining([
            "Email is required.",
            "Enter a valid email address.",
          ]),
        }),
      }),
    );
  });

  it("joins nested field paths with dots", () => {
    // Arrange
    const nestedValidator = new NestedValidator();

    // Act
    const result = nestedValidator.validate({ profile: { email: "" } });

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          "profile.email": ["Email is required."],
        }),
      }),
    );
  });
});
