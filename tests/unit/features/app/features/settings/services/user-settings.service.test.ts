import { UserSettingsService } from "@/features/app/features/settings/services/user-settings.service";
import type {
  UpdateUserSettingsPayload,
  UserSettings
} from "@/features/app/features/settings/types";
import { api } from "@/lib/api.library";

jest.mock("@/lib/api.library", () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

const mockGet = api.get as jest.Mock;
const mockPatch = api.patch as jest.Mock;
const mockDelete = api.delete as jest.Mock;

const mockSettings: UserSettings = {
  language: "en",
  defaultCurrency: "USD",
  emailNotifications: true
};

describe("UserSettingsService", () => {
  let service: UserSettingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserSettingsService();
  });

  describe("fetchSettings", () => {
    it("gets the settings from the settings endpoint", async () => {
      // Arrange
      mockGet.mockResolvedValue(mockSettings);

      // Act
      const result = await service.fetchSettings();

      // Assert
      expect(mockGet).toHaveBeenCalledWith("/settings");
      expect(result).toEqual(mockSettings);
    });
  });

  describe("updateSettings", () => {
    it("patches the settings endpoint with the payload", async () => {
      // Arrange
      const payload: UpdateUserSettingsPayload = { defaultCurrency: "EUR" };
      mockPatch.mockResolvedValue({ ...mockSettings, defaultCurrency: "EUR" });

      // Act
      const result = await service.updateSettings(payload);

      // Assert
      expect(mockPatch).toHaveBeenCalledWith("/settings", payload);
      expect(result).toEqual({ ...mockSettings, defaultCurrency: "EUR" });
    });
  });

  describe("deleteAllUserData", () => {
    it("deletes the authenticated user", async () => {
      // Arrange
      mockDelete.mockResolvedValue(undefined);

      // Act
      await service.deleteAllUserData();

      // Assert
      expect(mockDelete).toHaveBeenCalledWith("/users/me");
    });
  });
});
