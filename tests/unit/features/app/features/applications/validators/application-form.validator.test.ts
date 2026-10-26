import {
  type ApplicationFormInput,
  ApplicationFormValidator,
} from "@/features/app/features/applications/validators/application-form.validator";

const validInput: ApplicationFormInput = {
  companyName: "Acme Corp",
  positionTitle: "Software Engineer",
  employmentType: "FULL_TIME",
  workplaceType: "REMOTE",
  location: "Remote",
  website: "https://acme.example.com",
  salaryMin: "80000",
  salaryMax: "120000",
  currency: "USD",
  notes: "Referred by a friend.",
};

describe("ApplicationFormValidator", () => {
  let validator: ApplicationFormValidator;

  beforeEach(() => {
    validator = new ApplicationFormValidator();
  });

  it("accepts a fully populated form", () => {
    // Arrange
    const input = { ...validInput };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual({ success: true, data: input, errors: null });
  });

  it("accepts a minimal form with only the required fields", () => {
    // Arrange
    const input: ApplicationFormInput = {
      companyName: "Acme Corp",
      positionTitle: "Software Engineer",
      employmentType: "",
      workplaceType: "",
      location: "",
      website: "",
      salaryMin: "",
      salaryMax: "",
      currency: "",
      notes: "",
    };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects a blank company name", () => {
    // Arrange
    const input = { ...validInput, companyName: "   " };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          companyName: expect.arrayContaining([
            "Company name is required.",
          ]),
        }),
      }),
    );
  });

  it("rejects a blank position title", () => {
    // Arrange
    const input = { ...validInput, positionTitle: "" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          positionTitle: expect.arrayContaining([
            "Position title is required.",
          ]),
        }),
      }),
    );
  });

  it("rejects a website that is not http(s)", () => {
    // Arrange
    const input = { ...validInput, website: "acme.example.com" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          website: expect.arrayContaining([
            "Enter a valid URL starting with http:// or https://",
          ]),
        }),
      }),
    );
  });

  it("rejects a non-numeric salary", () => {
    // Arrange
    const input = { ...validInput, salaryMin: "a lot" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          salaryMin: expect.arrayContaining(["Must be a number."]),
        }),
      }),
    );
  });

  it("rejects a negative salary", () => {
    // Arrange
    const input = { ...validInput, salaryMin: "-1" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          salaryMin: expect.arrayContaining([
            "Salary must be non-negative.",
          ]),
        }),
      }),
    );
  });

  it("rejects a max salary below the min salary", () => {
    // Arrange
    const input = { ...validInput, salaryMin: "120000", salaryMax: "80000" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({
          salaryMax: expect.arrayContaining([
            "Max salary must be greater than or equal to min salary.",
          ]),
        }),
      }),
    );
  });

  it("accepts equal min and max salaries", () => {
    // Arrange
    const input = { ...validInput, salaryMin: "90000", salaryMax: "90000" };

    // Act
    const result = validator.validate(input);

    // Assert
    expect(result.success).toBe(true);
  });
});
