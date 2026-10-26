import {
  InterviewsService,
  type JobApplicationInterview,
} from "@/features/app/features/interviews/services/interviews.service";
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

const mockInterview: JobApplicationInterview = {
  id: "interview-1",
  applicationId: "app-1",
  type: "TECHNICAL",
  scheduledAt: "2026-03-01T14:00:00.000Z",
  timezone: "Asia/Manila",
  location: "Remote",
  notes: null,
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
};

const timezone = "Asia/Manila";

describe("InterviewsService", () => {
  let service: InterviewsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InterviewsService();
  });

  describe("fetchInterviewsInRange", () => {
    it("forwards from, to and timezone to the api client", async () => {
      // Arrange
      const params = {
        from: "2026-03-01T00:00:00",
        to: "2026-03-31T23:59:59",
        timezone,
      };
      mockGet.mockResolvedValue([mockInterview]);

      // Act
      const result = await service.fetchInterviewsInRange(params);

      // Assert
      expect(mockGet).toHaveBeenCalledWith("/interviews", { query: params });
      expect(result).toEqual([mockInterview]);
    });
  });

  describe("fetchUpcomingInterviews", () => {
    it("forwards from, timezone and top to the api client", async () => {
      // Arrange
      const params = { from: "2026-03-01T00:00:00Z", timezone, top: 1 };
      mockGet.mockResolvedValue([mockInterview]);

      // Act
      const result = await service.fetchUpcomingInterviews(params);

      // Assert
      expect(mockGet).toHaveBeenCalledWith("/interviews/upcoming", {
        query: params,
      });
      expect(result).toEqual([mockInterview]);
    });
  });

  describe("fetchApplicationInterviews", () => {
    it("gets the interviews of a single application", async () => {
      // Arrange
      mockGet.mockResolvedValue([mockInterview]);

      // Act
      const result = await service.fetchApplicationInterviews("app-1");

      // Assert
      expect(mockGet).toHaveBeenCalledWith("/applications/app-1/interviews");
      expect(result).toEqual([mockInterview]);
    });
  });

  describe("createInterview", () => {
    it("posts the payload to the application interviews endpoint", async () => {
      // Arrange
      const payload = {
        type: "TECHNICAL" as const,
        scheduledAt: "2026-03-01T14:00:00.000Z",
        timezone,
      };
      mockPost.mockResolvedValue(mockInterview);

      // Act
      const result = await service.createInterview("app-1", payload);

      // Assert
      expect(mockPost).toHaveBeenCalledWith(
        "/applications/app-1/interviews",
        payload,
      );
      expect(result).toEqual(mockInterview);
    });
  });

  describe("updateInterview", () => {
    it("patches the interview with the payload", async () => {
      // Arrange
      const payload = { location: "123 Main St" };
      mockPatch.mockResolvedValue(mockInterview);

      // Act
      const result = await service.updateInterview(
        "app-1",
        "interview-1",
        payload,
      );

      // Assert
      expect(mockPatch).toHaveBeenCalledWith(
        "/applications/app-1/interviews/interview-1",
        payload,
      );
      expect(result).toEqual(mockInterview);
    });
  });

  describe("deleteInterview", () => {
    it("deletes the interview", async () => {
      // Arrange
      mockDelete.mockResolvedValue(undefined);

      // Act
      await service.deleteInterview("app-1", "interview-1");

      // Assert
      expect(mockDelete).toHaveBeenCalledWith(
        "/applications/app-1/interviews/interview-1",
      );
    });
  });
});
