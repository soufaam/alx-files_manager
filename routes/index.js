import { Router } from 'express';
import AppController from '../controllers/AppController';
import usersController from '../controllers/UsersController';

const router = Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', usersController.postNew);

export default router;
