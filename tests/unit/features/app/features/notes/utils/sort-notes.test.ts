import type { ApplicationNote } from "@/features/app/features/notes/services/notes.service";
import { sortNotesByCreatedAt } from "@/features/app/features/notes/utils/sort-notes";

function buildNote(id: string, createdAt: string): ApplicationNote {
  return {
    id,
    applicationId: "app-1",
    content: `Note ${id}`,
    createdAt,
    updatedAt: createdAt,
  };
}

describe("sortNotesByCreatedAt", () => {
  const older = buildNote("older", "2026-01-01T10:00:00.000Z");
  const middle = buildNote("middle", "2026-02-01T10:00:00.000Z");
  const newer = buildNote("newer", "2026-03-01T10:00:00.000Z");

  it("orders oldest first when ascending", () => {
    // Arrange
    const notes = [newer, older, middle];

    // Act
    const result = sortNotesByCreatedAt(notes, "asc");

    // Assert
    expect(result.map((note) => note.id)).toEqual(["older", "middle", "newer"]);
  });

  it("orders newest first when descending", () => {
    // Arrange
    const notes = [older, newer, middle];

    // Act
    const result = sortNotesByCreatedAt(notes, "desc");

    // Assert
    expect(result.map((note) => note.id)).toEqual(["newer", "middle", "older"]);
  });

  it("keeps the original order for equal timestamps", () => {
    // Arrange
    const first = buildNote("first", "2026-01-01T10:00:00.000Z");
    const second = buildNote("second", "2026-01-01T10:00:00.000Z");
    const notes = [first, second];

    // Act
    const result = sortNotesByCreatedAt(notes, "desc");

    // Assert
    expect(result.map((note) => note.id)).toEqual(["first", "second"]);
  });

  it("does not mutate the input array", () => {
    // Arrange
    const notes = [newer, older, middle];
    const snapshot = [...notes];

    // Act
    sortNotesByCreatedAt(notes, "asc");

    // Assert
    expect(notes).toEqual(snapshot);
  });
});
