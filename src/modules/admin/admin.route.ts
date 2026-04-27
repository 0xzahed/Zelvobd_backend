
import { Router } from 'express';
import { requireAdminAuth } from '../../middlewares/requireAdminAuth.js';
import { adminController } from './admin.controller.js';

export const adminRouter = Router();

adminRouter.use(requireAdminAuth);

adminRouter.post('/', adminController.createAdmin);
adminRouter.get('/', adminController.getAllAdmins);
adminRouter.patch('/:id', adminController.updateAdmin);
adminRouter.put('/:id', adminController.updateAdmin);
adminRouter.delete('/:id', adminController.deleteAdmin);
