import {
  applyDocumentLanguage,
  normalizeLanguage,
  persistLanguage,
  resolveInitialLanguage,
} from "@/i18n/language";

const STORAGE_KEY = "job-app-tracker.language";

describe("normalizeLanguage", () => {
  it.each([null, undefined, "", "   "])("returns null for %p", (value) => {
    // Act & Assert
    expect(normalizeLanguage(value as string | null | undefined)).toBeNull();
  });

  it("lowercases and trims a supported language", () => {
    // Act & Assert
    expect(normalizeLanguage("  ES ")).toBe("es");
  });

  it("extracts the base language from a region tag", () => {
    // Act & Assert
    expect(normalizeLanguage("es-MX")).toBe("es");
  });

  it("returns null for unsupported languages", () => {
    // Act & Assert
    expect(normalizeLanguage("fr")).toBeNull();
    expect(normalizeLanguage("fr-CA")).toBeNull();
  });
});

describe("resolveInitialLanguage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    Reflect.deleteProperty(window.navigator, "languages");
    Reflect.deleteProperty(window.navigator, "language");
  });

  it("prefers the stored language", () => {
    // Arrange
    localStorage.setItem(STORAGE_KEY, "es");

    // Act
    const language = resolveInitialLanguage();

    // Assert
    expect(language).toBe("es");
  });

  it("falls back to the browser preference when nothing is stored", () => {
    // Arrange
    Object.defineProperty(window.navigator, "languages", {
      value: ["fr", "es-MX"],
      configurable: true,
    });

    // Act
    const language = resolveInitialLanguage();

    // Assert
    expect(language).toBe("es");
  });

  it("falls back to the default language when nothing matches", () => {
    // Arrange
    Object.defineProperty(window.navigator, "languages", {
      value: ["fr"],
      configurable: true,
    });
    Object.defineProperty(window.navigator, "language", {
      value: "de",
      configurable: true,
    });

    // Act
    const language = resolveInitialLanguage();

    // Assert
    expect(language).toBe("en");
  });
});

describe("persistLanguage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores the normalized language", () => {
    // Arrange
    const value = "es-MX";

    // Act
    persistLanguage(value);

    // Assert
    expect(localStorage.getItem(STORAGE_KEY)).toBe("es");
  });

  it("does not store unsupported languages", () => {
    // Arrange
    const value = "fr";

    // Act
    persistLanguage(value);

    // Assert
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("applyDocumentLanguage", () => {
  afterEach(() => {
    document.documentElement.lang = "";
  });

  it("sets the document language to the normalized language", () => {
    // Act
    applyDocumentLanguage("es-MX");

    // Assert
    expect(document.documentElement.lang).toBe("es");
  });

  it("falls back to the default language for unsupported values", () => {
    // Act
    applyDocumentLanguage("fr");

    // Assert
    expect(document.documentElement.lang).toBe("en");
  });
});
