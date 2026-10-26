import { Router } from 'express';
import { remindersController } from './reminders.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Protect all reminders routes with JWT authentication
router.use(authenticate);

router.get('/', remindersController.getReminders);
router.post('/', remindersController.createReminder);
router.get('/due', remindersController.getDueReminders);

// Tag management routes (must be placed before /:id)
router.get('/tags', remindersController.getTags);
router.patch('/tags/color', remindersController.updateTagColor);
router.post('/tags/rename', remindersController.renameTag);
router.post('/tags/delete', remindersController.deleteTag);

router.get('/:id', remindersController.getReminderById);
router.patch('/:id', remindersController.updateReminder);
router.patch('/:id/snooze', remindersController.snoozeReminder);
router.patch('/:id/complete', remindersController.completeReminder);
router.delete('/:id', remindersController.deleteReminder);

export default router;
