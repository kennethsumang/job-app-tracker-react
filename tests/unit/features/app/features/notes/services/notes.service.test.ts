import {
  NotesService,
  type ApplicationNote,
} from "@/features/app/features/notes/services/notes.service";
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

const mockNote: ApplicationNote = {
  id: "note-1",
  applicationId: "app-1",
  content: "Follow up with the recruiter",
  createdAt: "2026-02-01T10:00:00.000Z",
  updatedAt: "2026-02-01T10:00:00.000Z",
};

describe("NotesService", () => {
  let service: NotesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotesService();
  });

  describe("fetchApplicationNotes", () => {
    it("gets the notes of a single application", async () => {
      // Arrange
      mockGet.mockResolvedValue([mockNote]);

      // Act
      const result = await service.fetchApplicationNotes("app-1");

      // Assert
      expect(mockGet).toHaveBeenCalledWith("/applications/app-1/notes");
      expect(result).toEqual([mockNote]);
    });
  });

  describe("createNote", () => {
    it("posts the content to the application notes endpoint", async () => {
      // Arrange
      const payload = { content: "Follow up with the recruiter" };
      mockPost.mockResolvedValue(mockNote);

      // Act
      const result = await service.createNote("app-1", payload);

      // Assert
      expect(mockPost).toHaveBeenCalledWith(
        "/applications/app-1/notes",
        payload,
      );
      expect(result).toEqual(mockNote);
    });
  });

  describe("updateNote", () => {
    it("patches the note with the payload", async () => {
      // Arrange
      const payload = { content: "Updated content" };
      mockPatch.mockResolvedValue({ ...mockNote, content: "Updated content" });

      // Act
      const result = await service.updateNote("app-1", "note-1", payload);

      // Assert
      expect(mockPatch).toHaveBeenCalledWith(
        "/applications/app-1/notes/note-1",
        payload,
      );
      expect(result.content).toBe("Updated content");
    });
  });

  describe("deleteNote", () => {
    it("deletes the note", async () => {
      // Arrange
      mockDelete.mockResolvedValue(undefined);

      // Act
      const result = await service.deleteNote("app-1", "note-1");

      // Assert
      expect(mockDelete).toHaveBeenCalledWith(
        "/applications/app-1/notes/note-1",
      );
      expect(result).toBeUndefined();
    });
  });
});
