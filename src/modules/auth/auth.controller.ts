import { Request, Response } from 'express';
import { asyncHandler, sendSuccess } from '../../utils/response';
import * as authService from './auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  const result = await authService.registerUser(name, email, password);
  sendSuccess(res, result, 'Registration successful', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const result = await authService.loginUser(email, password);
  sendSuccess(res, result, 'Login successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refresh_token } = req.body as { refresh_token: string };
  const tokens = await authService.refreshTokens(refresh_token);
  sendSuccess(res, tokens, 'Tokens refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logoutUser(req.user!.userId);
  sendSuccess(res, null, 'Logged out successfully');
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, { user: req.user }, 'User info retrieved');
});
