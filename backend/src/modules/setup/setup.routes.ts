import { Router } from 'express';
import { SetupService } from './setup.service';
import { SetupController } from './setup.controller';
import { validate } from '../../core/middleware/validation';
import { z } from 'zod';

const router = Router();
const service = new SetupService();
const controller = new SetupController(service);

const setupSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        fullName: z.string().min(1),
    }),
});

router.post('/setup', validate(setupSchema), controller.setup);

export default router;
