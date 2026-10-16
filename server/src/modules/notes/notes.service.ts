import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { cacheService } from '../../services/cache.service';
import {
  CreateNoteInput,
  UpdateNoteInput,
  SearchNoteInput,
  RenameTagInput,
  DeleteTagInput,
  UpdateNoteTagColorInput,
} from './notes.schema';
import { getDefaultTagColor } from '../../utils/tagColors';

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
   * 1. Get notes with search, tag filtering, and pagination (T2.1)
   */
  async getNotes(userId: string, filter?: SearchNoteInput) {
    const where: any = { userId };

    if (filter?.q) {
      where.OR = [
        { title: { contains: filter.q, mode: 'insensitive' } },
        { content: { contains: filter.q, mode: 'insensitive' } },
      ];
    }

    if (filter?.tag) {
      const cleanTag = filter.tag.toLowerCase().trim().replace(/^#/, '');
      where.tags = {
        array_contains: cleanTag,
      };
    }

    const limit = Math.min(Math.max(filter?.limit ? Number(filter.limit) : 24, 1), 1000);
    const page = filter?.page ? Math.max(Number(filter.page), 1) : 1;
    const skip =
      filter?.offset !== undefined
        ? Math.max(Number(filter.offset), 0)
        : (page - 1) * limit;
    const currentPage =
      filter?.offset !== undefined ? Math.floor(skip / limit) + 1 : page;

    const cacheKey = `cache:notes:${userId}:${filter?.q || ''}:${filter?.tag || ''}:${currentPage}:${limit}`;

    return cacheService.remember(cacheKey, 60, async () => {
      const [total, notes] = await Promise.all([
        prisma.note.count({ where }),
        prisma.note.findMany({
          where,
          orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
          take: limit,
          skip,
        }),
      ]);

      const totalPages = Math.ceil(total / limit) || 1;

      return {
        items: notes,
        pagination: {
          page: currentPage,
          limit,
          total,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
        },
      };
    });
  }

  /**
   * Invalidate notes and dashboard caches for user
   */
  async invalidateUserNotesCache(userId: string) {
    await Promise.all([
      cacheService.del(`cache:dashboard:${userId}`),
      cacheService.delPattern(`cache:notes:${userId}*`),
    ]);
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

    const note = await prisma.note.create({
      data: {
        userId,
        title: cleanTitle,
        content: cleanContent,
        color: input.color,
        tags: input.tags,
        isPinned: input.isPinned,
      },
    });

    await this.invalidateUserNotesCache(userId);
    return note;
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

    const updated = await prisma.note.update({
      where: { id: noteId },
      data,
    });

    await this.invalidateUserNotesCache(userId);
    return updated;
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

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: { isPinned: !note.isPinned },
    });

    await this.invalidateUserNotesCache(userId);
    return updated;
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
    await this.invalidateUserNotesCache(userId);
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
   * 8. Get all unique tags with count and color
   */
  async getTags(userId: string) {
    const [notes, tagRecords] = await Promise.all([
      prisma.note.findMany({
        where: { userId },
        select: { tags: true },
      }),
      prisma.tag.findMany({
        where: { userId, type: 'NOTE' },
      }),
    ]);

    const colorMap = new Map<string, string>();
    for (const record of tagRecords) {
      colorMap.set(record.name.toLowerCase().trim(), record.color);
    }

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
      .map(([name, count]) => ({
        name,
        count,
        color: colorMap.get(name) || getDefaultTagColor(name),
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  /**
   * 9. Update tag color
   */
  async updateTagColor(userId: string, input: UpdateNoteTagColorInput) {
    const cleanTag = input.tag.toLowerCase().trim().replace(/^#/, '');
    const tagRecord = await prisma.tag.upsert({
      where: {
        userId_type_name: {
          userId,
          type: 'NOTE',
          name: cleanTag,
        },
      },
      create: {
        userId,
        type: 'NOTE',
        name: cleanTag,
        color: input.color,
      },
      update: {
        color: input.color,
      },
    });

    await this.invalidateUserNotesCache(userId);
    return tagRecord;
  }

  /**
   * 10. Rename tag across all notes of user
   */
  async renameTag(userId: string, input: RenameTagInput) {
    const cleanOld = input.oldTag.toLowerCase().trim().replace(/^#/, '');
    const cleanNew = input.newTag.toLowerCase().trim().replace(/^#/, '');

    const notes = await prisma.note.findMany({
      where: { userId },
      select: { id: true, tags: true },
    });

    const notesToUpdate = notes.filter((n) => {
      const tags = (n.tags as string[]) || [];
      return tags.some((t) => t.toLowerCase().trim() === cleanOld);
    });

    if (notesToUpdate.length > 0) {
      const updates = notesToUpdate.map((n) => {
        const tags = (n.tags as string[]) || [];
        const updatedTags = Array.from(
          new Set(
            tags.map((t) => (t.toLowerCase().trim() === cleanOld ? cleanNew : t))
          )
        );
        return prisma.note.update({
          where: { id: n.id },
          data: { tags: updatedTags },
        });
      });
      await prisma.$transaction(updates);
    }

    // Sync in Tag table
    const existingTag = await prisma.tag.findUnique({
      where: {
        userId_type_name: { userId, type: 'NOTE', name: cleanOld },
      },
    });

    if (existingTag) {
      await prisma.tag.delete({ where: { id: existingTag.id } });
      await prisma.tag.upsert({
        where: {
          userId_type_name: { userId, type: 'NOTE', name: cleanNew },
        },
        create: {
          userId,
          type: 'NOTE',
          name: cleanNew,
          color: existingTag.color,
        },
        update: {
          color: existingTag.color,
        },
      });
    }

    await this.invalidateUserNotesCache(userId);
    return { updatedCount: notesToUpdate.length, oldTag: cleanOld, newTag: cleanNew };
  }

  /**
   * 11. Delete tag across all notes of user
   */
  async deleteTag(userId: string, input: DeleteTagInput) {
    const cleanTag = input.tag.toLowerCase().trim().replace(/^#/, '');
    const notes = await prisma.note.findMany({
      where: { userId },
      select: { id: true, tags: true },
    });

    const notesToUpdate = notes.filter((n) => {
      const tags = (n.tags as string[]) || [];
      return tags.some((t) => t.toLowerCase().trim() === cleanTag);
    });

    if (notesToUpdate.length > 0) {
      const updates = notesToUpdate.map((n) => {
        const tags = (n.tags as string[]) || [];
        const updatedTags = tags.filter((t) => t.toLowerCase().trim() !== cleanTag);
        return prisma.note.update({
          where: { id: n.id },
          data: { tags: updatedTags },
        });
      });
      await prisma.$transaction(updates);
    }

    await prisma.tag.deleteMany({
      where: { userId, type: 'NOTE', name: cleanTag },
    });

    await this.invalidateUserNotesCache(userId);
    return { updatedCount: notesToUpdate.length, deletedTag: cleanTag };
  }
}

export const notesService = new NotesService();
