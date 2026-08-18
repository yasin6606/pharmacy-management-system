import {Router} from 'express';
import {SetupService} from './setup.service';
import {SetupController} from './setup.controller';
import {validate} from '../../core/middleware/validation';
import {z} from 'zod';
import container from '../../container';

const router = Router();

const setupService = container.resolve<SetupService>('setupService');
const controller = new SetupController(setupService);

/** Schema for the one-time first-manager bootstrap payload */
const setupSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        fullName: z.string().min(1),
    }),
});

/**
 * POST /api/v1/setup
 * Creates the first manager account. Rejects if any employee already exists.
 * Intentionally public so a fresh deployment can be initialized.
 */
router.post('/setup', validate(setupSchema), controller.setup);

export default router;
