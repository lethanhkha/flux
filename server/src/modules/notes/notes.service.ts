import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import {
  CreateNoteInput,
  UpdateNoteInput,
  SearchNoteInput,
  RenameTagInput,
  DeleteTagInput,
} from './notes.schema';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as any);

export class NotesService {
  /**
   * Helper to sanitize text using DOMPurify against Stored XSS attacks
   */
  private sanitizeContent(raw: string): string {
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
        'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
        'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'span'
      ],
      ALLOWED_ATTR: ['href', 'name', 'target', 'class', 'style'],
    });
  }

  /**
   * 1. Get notes with search and tag filtering
   */
  async getNotes(userId: string, filter?: SearchNoteInput) {
    const where: any = { userId };

    if (filter?.q) {
      where.OR = [
        { title: { contains: filter.q, mode: 'insensitive' } },
        { content: { contains: filter.q, mode: 'insensitive' } },
      ];
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    });

    // Tag filtering on JSON array
    if (filter?.tag) {
      const searchTag = filter.tag.toLowerCase();
      return notes.filter((n) => {
        const tags = (n.tags as string[]) || [];
        return tags.some((t) => t.toLowerCase() === searchTag);
      });
    }

    return notes;
  }

  /**
   * 2. Get note by ID
   */
  async getNoteById(userId: string, noteId: string) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId },
      include: { attachments: true },
    });

    if (!note) {
      throw new AppError('Không tìm thấy ghi chú.', 404);
    }

    return note;
  }

  /**
   * 3. Create Note with DOMPurify sanitization
   */
  async createNote(userId: string, input: CreateNoteInput) {
    const cleanTitle = DOMPurify.sanitize(input.title).trim();
    const cleanContent = this.sanitizeContent(input.content);

    return prisma.note.create({
      data: {
        userId,
        title: cleanTitle,
        content: cleanContent,
        color: input.color,
        tags: input.tags,
        isPinned: input.isPinned,
      },
    });
  }

  /**
   * 4. Update Note
   */
  async updateNote(userId: string, noteId: string, input: UpdateNoteInput) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });

    if (!note) {
      throw new AppError('Không tìm thấy ghi chú.', 404);
    }

    const data: any = {};
    if (input.title !== undefined) data.title = DOMPurify.sanitize(input.title).trim();
    if (input.content !== undefined) data.content = this.sanitizeContent(input.content);
    if (input.color !== undefined) data.color = input.color;
    if (input.tags !== undefined) data.tags = input.tags;
    if (input.isPinned !== undefined) data.isPinned = input.isPinned;

    return prisma.note.update({
      where: { id: noteId },
      data,
    });
  }

  /**
   * 5. Toggle Pin status
   */
  async togglePin(userId: string, noteId: string) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });

    if (!note) {
      throw new AppError('Không tìm thấy ghi chú.', 404);
    }

    return prisma.note.update({
      where: { id: noteId },
      data: { isPinned: !note.isPinned },
    });
  }

  /**
   * 6. Delete Note
   */
  async deleteNote(userId: string, noteId: string) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });

    if (!note) {
      throw new AppError('Không tìm thấy ghi chú.', 404);
    }

    await prisma.note.delete({ where: { id: noteId } });
    return { message: 'Đã xóa ghi chú thành công.' };
  }

  /**
   * 7. Top Pinned Notes for Unified Dashboard Widget (T4.3)
   */
  async getPinnedNotes(userId: string, limit = 3) {
    return prisma.note.findMany({
      where: { userId, isPinned: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * 8. Get all unique tags with count
   */
  async getTags(userId: string) {
    const notes = await prisma.note.findMany({
      where: { userId },
      select: { tags: true },
    });

    const tagCounts: Record<string, number> = {};
    for (const n of notes) {
      const tags = (n.tags as string[]) || [];
      for (const t of tags) {
        if (!t) continue;
        const normalized = t.toLowerCase().trim();
        tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
      }
    }

    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  /**
   * 9. Rename tag across all notes of user
   */
  async renameTag(userId: string, input: RenameTagInput) {
    const { oldTag, newTag } = input;
    const notes = await prisma.note.findMany({
      where: { userId },
      select: { id: true, tags: true },
    });

    const notesToUpdate = notes.filter((n) => {
      const tags = (n.tags as string[]) || [];
      return tags.some((t) => t.toLowerCase().trim() === oldTag);
    });

    if (notesToUpdate.length === 0) {
      return { updatedCount: 0, oldTag, newTag };
    }

    const updates = notesToUpdate.map((n) => {
      const tags = (n.tags as string[]) || [];
      const updatedTags = Array.from(
        new Set(
          tags.map((t) => (t.toLowerCase().trim() === oldTag ? newTag : t))
        )
      );
      return prisma.note.update({
        where: { id: n.id },
        data: { tags: updatedTags },
      });
    });

    await prisma.$transaction(updates);
    return { updatedCount: updates.length, oldTag, newTag };
  }

  /**
   * 10. Delete tag across all notes of user
   */
  async deleteTag(userId: string, input: DeleteTagInput) {
    const { tag } = input;
    const notes = await prisma.note.findMany({
      where: { userId },
      select: { id: true, tags: true },
    });

    const notesToUpdate = notes.filter((n) => {
      const tags = (n.tags as string[]) || [];
      return tags.some((t) => t.toLowerCase().trim() === tag);
    });

    if (notesToUpdate.length === 0) {
      return { updatedCount: 0, deletedTag: tag };
    }

    const updates = notesToUpdate.map((n) => {
      const tags = (n.tags as string[]) || [];
      const updatedTags = tags.filter((t) => t.toLowerCase().trim() !== tag);
      return prisma.note.update({
        where: { id: n.id },
        data: { tags: updatedTags },
      });
    });

    await prisma.$transaction(updates);
    return { updatedCount: updates.length, deletedTag: tag };
  }
}

export const notesService = new NotesService();
