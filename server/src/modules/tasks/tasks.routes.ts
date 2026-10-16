import { Router } from 'express';
import { tasksController } from './tasks.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Protect all tasks routes with JWT authentication
router.use(authenticate);

router.get('/', tasksController.getTasks);
router.post('/', tasksController.createTask);
router.get('/tags', tasksController.getTags);
router.patch('/tags/color', tasksController.updateTagColor);
router.post('/tags/rename', tasksController.renameTag);
router.post('/tags/delete', tasksController.deleteTag);
router.get('/priority', tasksController.getTopPriorityTasks);
router.get('/top-priority', tasksController.getTopPriorityTasks);
router.patch('/:id', tasksController.updateTask);
router.patch('/:id/toggle', tasksController.toggleTaskComplete);
router.delete('/:id', tasksController.deleteTask);

export default router;
