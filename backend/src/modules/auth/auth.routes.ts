import {Router} from 'express';
import {AuthController} from './auth.controller';
import {AuthService} from './auth.service';
import {validate} from '../../core/middleware/validation';
import {loginSchema} from './dto/auth.dto';
import {authMiddleware} from '../../core/middleware/auth';
import {loginRateLimit} from '../../core/middleware/rateLimit';
import container from '../../container';

const router = Router();

// Resolve singleton AuthService from the DI container (no ad-hoc `new`)
const authService = container.resolve<AuthService>('authService');
const authController = new AuthController(authService);

/**
 * POST /api/v1/auth/login
 * Public — rate-limited to mitigate brute-force / credential stuffing.
 */
router.post('/login', loginRateLimit, validate(loginSchema), authController.login);

/** POST /api/v1/auth/logout — requires a valid session JWT */
router.post('/logout', authMiddleware, authController.logout);

/** GET /api/v1/auth/me — current authenticated employee profile */
router.get('/me', authMiddleware, authController.me);

export default router;
