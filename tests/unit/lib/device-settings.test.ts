import { getDeviceTimezone } from "@/lib/device-settings";

describe("getDeviceTimezone", () => {
  it("returns the IANA timezone reported by Intl", () => {
    // Arrange
    const expected = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Act
    const result = getDeviceTimezone();

    // Assert
    expect(result).toBe(expected);
    expect(result).toEqual(expect.any(String));
    expect(result.length).toBeGreaterThan(0);
  });
});
