import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { AppError } from '../../core/errors/AppError';

export class AuthController {
  constructor(private authService: AuthService) {}

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress || '';
    const { token, employee } = await this.authService.login(email, password, ip);

    res.json({ success: true, data: { employee, token } });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.user;
    await this.authService.logout(sessionId);

    res.json({ success: true, data: null, message: 'Logged out' });
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    const employee = await this.authService.getProfile(req.user.userId);
    res.json({ success: true, data: employee });
  });
}
