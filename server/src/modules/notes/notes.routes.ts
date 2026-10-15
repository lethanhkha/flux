import { Router } from 'express';
import { notesController } from './notes.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Protect all notes routes with JWT authentication
router.use(authenticate);

router.get('/', notesController.getNotes);
router.post('/', notesController.createNote);
router.get('/pinned', notesController.getPinnedNotes);
router.get('/:id', notesController.getNoteById);
router.patch('/:id', notesController.updateNote);
router.patch('/:id/pin', notesController.togglePin);
router.delete('/:id', notesController.deleteNote);

export default router;
