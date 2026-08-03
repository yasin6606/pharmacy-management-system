import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { validate } from '../../core/middleware/validation';
import { loginSchema } from './dto/auth.dto';
import { authMiddleware } from '../../core/middleware/auth';

const router = Router();
const authService = new AuthService();
const authController = new AuthController(authService);

router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);

export default router;
