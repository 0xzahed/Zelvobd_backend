import { Router } from 'express';
import { requireAdminAuth } from '../../middlewares/requireAdminAuth.js';
import { customerController } from './customer.controller.js';

export const customerRouter = Router();

// All customer endpoints require admin auth
customerRouter.use(requireAdminAuth);

customerRouter.get('/', customerController.getCustomers);
customerRouter.get('/stats', customerController.getCustomerStats);
