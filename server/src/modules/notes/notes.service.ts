import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { CreateNoteInput, UpdateNoteInput, SearchNoteInput } from './notes.schema';

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
}

export const notesService = new NotesService();
