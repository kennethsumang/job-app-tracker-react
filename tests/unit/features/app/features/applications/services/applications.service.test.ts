import {
  ApplicationsService,
  type ApplicationFilters,
  type JobApplication,
} from "@/features/app/features/applications/services/applications.service";
import { api } from "@/lib/api.library";

jest.mock("@/lib/api.library", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPatch = api.patch as jest.Mock;
const mockDelete = api.delete as jest.Mock;

const mockApplication: JobApplication = {
  id: "app-1",
  userId: "user-1",
  companyName: "Acme Corp",
  companyWebsite: "https://acme.example.com",
  positionTitle: "Software Engineer",
  jobLocation: "Remote",
  employmentType: "FULL_TIME",
  workplaceType: "REMOTE",
  salaryMin: 80000,
  salaryMax: 120000,
  salaryCurrency: "USD",
  status: "APPLIED",
  appliedAt: "2026-01-02T00:00:00.000Z",
  lastContactedAt: null,
  offerDeadline: null,
  rejectedAt: null,
  recruiterName: null,
  recruiterEmail: null,
  recruiterPhone: null,
  jobPostingUrl: null,
  coverLetterUrl: null,
  source: null,
  notes: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  deletedAt: null,
};

describe("ApplicationsService", () => {
  let service: ApplicationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ApplicationsService();
  });

  describe("fetchApplications", () => {
    it("forwards every filter to the api client", async () => {
      // Arrange
      const filters: ApplicationFilters = {
        search: "acme",
        statuses: ["APPLIED", "INTERVIEW"],
        showDeleted: true,
        page: 2,
        limit: 10,
        appliedFrom: "2026-01-01",
        appliedTo: "2026-02-01",
        timezone: "Asia/Manila",
      };
      const response = { data: [mockApplication], count: 1 };
      mockGet.mockResolvedValue(response);

      // Act
      const result = await service.fetchApplications(filters);

      // Assert
      expect(mockGet).toHaveBeenCalledWith("/applications", {
        query: filters,
      });
      expect(result).toEqual(response);
    });
  });

  describe("fetchApplicationsCount", () => {
    it("requests a single-row page and returns the count", async () => {
      // Arrange
      mockGet.mockResolvedValue({ data: [mockApplication], count: 42 });

      // Act
      const result = await service.fetchApplicationsCount({
        statuses: ["APPLIED"],
      });

      // Assert
      expect(mockGet).toHaveBeenCalledWith("/applications", {
        query: expect.objectContaining({
          statuses: ["APPLIED"],
          page: 1,
          limit: 1,
        }),
      });
      expect(result).toBe(42);
    });
  });

  describe("fetchApplication", () => {
    it("gets a single application by id", async () => {
      // Arrange
      mockGet.mockResolvedValue(mockApplication);

      // Act
      const result = await service.fetchApplication("app-1");

      // Assert
      expect(mockGet).toHaveBeenCalledWith("/applications/app-1");
      expect(result).toEqual(mockApplication);
    });
  });

  describe("createApplication", () => {
    it("posts the payload to the applications endpoint", async () => {
      // Arrange
      const payload = {
        companyName: "Acme Corp",
        positionTitle: "Software Engineer",
      };
      mockPost.mockResolvedValue(mockApplication);

      // Act
      const result = await service.createApplication(payload);

      // Assert
      expect(mockPost).toHaveBeenCalledWith("/applications", payload);
      expect(result).toEqual(mockApplication);
    });
  });

  describe("updateApplication", () => {
    it("patches the application with the payload", async () => {
      // Arrange
      const payload = { positionTitle: "Senior Software Engineer" };
      mockPatch.mockResolvedValue(mockApplication);

      // Act
      const result = await service.updateApplication("app-1", payload);

      // Assert
      expect(mockPatch).toHaveBeenCalledWith("/applications/app-1", payload);
      expect(result).toEqual(mockApplication);
    });
  });

  describe("deleteApplication", () => {
    it("soft-deletes the application", async () => {
      // Arrange
      mockDelete.mockResolvedValue(mockApplication);

      // Act
      const result = await service.deleteApplication("app-1");

      // Assert
      expect(mockDelete).toHaveBeenCalledWith("/applications/app-1");
      expect(result).toEqual(mockApplication);
    });
  });

  describe("restoreApplication", () => {
    it("posts to the restore endpoint", async () => {
      // Arrange
      mockPost.mockResolvedValue(mockApplication);

      // Act
      const result = await service.restoreApplication("app-1");

      // Assert
      expect(mockPost).toHaveBeenCalledWith("/applications/app-1/restore");
      expect(result).toEqual(mockApplication);
    });
  });

  describe("updateApplicationStatus", () => {
    it("sends status and changedAt when changedAt is provided", async () => {
      // Arrange
      mockPatch.mockResolvedValue(mockApplication);

      // Act
      const result = await service.updateApplicationStatus(
        "app-1",
        "INTERVIEW",
        "2026-01-03T00:00:00.000Z",
      );

      // Assert
      expect(mockPatch).toHaveBeenCalledWith("/applications/app-1/status", {
        status: "INTERVIEW",
        changedAt: "2026-01-03T00:00:00.000Z",
      });
      expect(result).toEqual(mockApplication);
    });

    it("omits changedAt when it is not provided", async () => {
      // Arrange
      mockPatch.mockResolvedValue(mockApplication);

      // Act
      await service.updateApplicationStatus("app-1", "OFFER");

      // Assert
      expect(mockPatch).toHaveBeenCalledWith("/applications/app-1/status", {
        status: "OFFER",
      });
    });
  });

  describe("permanentDeleteApplication", () => {
    it("deletes the application permanently", async () => {
      // Arrange
      mockDelete.mockResolvedValue(undefined);

      // Act
      await service.permanentDeleteApplication("app-1");

      // Assert
      expect(mockDelete).toHaveBeenCalledWith(
        "/applications/app-1/permanent",
      );
    });
  });
});
