import { Router } from 'express';

import { authController } from './auth.controller';

export const authRouter = Router();

authRouter.post('/admin/login', authController.adminLogin);
authRouter.post('/admin/refresh-token', authController.refreshAdminToken);
authRouter.post('/admin/logout', authController.adminLogout);
