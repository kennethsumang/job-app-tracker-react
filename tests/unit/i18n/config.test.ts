import { isSupportedLanguage } from "@/i18n/config";

describe("isSupportedLanguage", () => {
  it.each(["en", "es"])("returns true for %s", (language) => {
    // Act & Assert
    expect(isSupportedLanguage(language)).toBe(true);
  });

  it("returns false for unsupported language codes", () => {
    // Act & Assert
    expect(isSupportedLanguage("fr")).toBe(false);
  });

  it.each([null, undefined, 42, true, {}, ["en"]])(
    "returns false for non-string value %p",
    (value) => {
      // Act & Assert
      expect(isSupportedLanguage(value)).toBe(false);
    },
  );
});
