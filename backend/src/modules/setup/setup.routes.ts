import {Router} from 'express';
import {SetupService} from './setup.service';
import {SetupController} from './setup.controller';
import {validate} from '../../core/middleware/validation';
import {z} from 'zod';
import container from '../../container';
import {passwordSchema} from '../../core/utils/passwordPolicy';
import {rateLimit} from '../../core/middleware/rateLimit';

const router = Router();

const setupService = container.resolve<SetupService>('setupService');
const controller = new SetupController(setupService);

const setupSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: passwordSchema,
        fullName: z.string().min(1).max(200),
    }),
});

const setupRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many setup attempts. Try again later.',
});

router.post('/setup', setupRateLimit, validate(setupSchema), controller.setup);

export default router;
