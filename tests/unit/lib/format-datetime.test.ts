import { formatDateTimeInTimeZone } from "@/lib/format-datetime";

describe("formatDateTimeInTimeZone", () => {
  const iso = "2026-03-01T15:00:00.000Z";

  it("formats an ISO timestamp in the requested timezone", () => {
    // Arrange
    const expected = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(new Date(iso));

    // Act
    const result = formatDateTimeInTimeZone(iso, "UTC", "en-US");

    // Assert
    expect(result).toBe(expected);
  });

  it("renders the same instant differently across timezones", () => {
    // Arrange
    const utc = formatDateTimeInTimeZone(iso, "UTC", "en-US");
    const newYork = formatDateTimeInTimeZone(iso, "America/New_York", "en-US");

    // Act
    const different = utc !== newYork;

    // Assert
    expect(different).toBe(true);
    expect(utc).toContain("2026");
    expect(newYork).toContain("2026");
  });

  it("returns null for an invalid timestamp", () => {
    // Arrange
    const invalid = "not-a-date";

    // Act
    const result = formatDateTimeInTimeZone(invalid, "UTC", "en-US");

    // Assert
    expect(result).toBeNull();
  });

  it("returns null for an invalid timezone", () => {
    // Arrange
    const invalidZone = "Not/AZone";

    // Act
    const result = formatDateTimeInTimeZone(iso, invalidZone, "en-US");

    // Assert
    expect(result).toBeNull();
  });
});
