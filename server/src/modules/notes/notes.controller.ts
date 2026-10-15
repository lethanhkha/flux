import { Request, Response, NextFunction } from 'express';
import { notesService } from './notes.service';
import { createNoteSchema, updateNoteSchema, searchNoteSchema } from './notes.schema';

export class NotesController {
  async getNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const filter = searchNoteSchema.parse(req.query);
      const notes = await notesService.getNotes(req.user!.userId, filter);
      res.status(200).json({ status: 'success', data: notes });
    } catch (error) {
      next(error);
    }
  }

  async getNoteById(req: Request, res: Response, next: NextFunction) {
    try {
      const note = await notesService.getNoteById(req.user!.userId, req.params.id);
      res.status(200).json({ status: 'success', data: note });
    } catch (error) {
      next(error);
    }
  }

  async createNote(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createNoteSchema.parse(req.body);
      const note = await notesService.createNote(req.user!.userId, validated);
      res.status(201).json({ status: 'success', data: note });
    } catch (error) {
      next(error);
    }
  }

  async updateNote(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateNoteSchema.parse(req.body);
      const note = await notesService.updateNote(
        req.user!.userId,
        req.params.id,
        validated
      );
      res.status(200).json({ status: 'success', data: note });
    } catch (error) {
      next(error);
    }
  }

  async togglePin(req: Request, res: Response, next: NextFunction) {
    try {
      const note = await notesService.togglePin(req.user!.userId, req.params.id);
      res.status(200).json({ status: 'success', data: note });
    } catch (error) {
      next(error);
    }
  }

  async deleteNote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notesService.deleteNote(req.user!.userId, req.params.id);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getPinnedNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const notes = await notesService.getPinnedNotes(req.user!.userId);
      res.status(200).json({ status: 'success', data: notes });
    } catch (error) {
      next(error);
    }
  }
}

export const notesController = new NotesController();
