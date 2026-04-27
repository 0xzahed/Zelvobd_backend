import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth.js';
import { freeDeliveryController } from './freeDelivery.controller.js';

export const freeDeliveryRouter = Router();

freeDeliveryRouter.get('/', freeDeliveryController.getFreeDelivery);

freeDeliveryRouter.use(requireAdminAuth);

freeDeliveryRouter.get('/admin', freeDeliveryController.getFreeDeliveryAdmin);
freeDeliveryRouter.patch('/campaign', freeDeliveryController.updateFreeDeliveryCampaign);
freeDeliveryRouter.patch('/categories', freeDeliveryController.updateFreeDeliveryCategories);
freeDeliveryRouter.patch('/sub-categories', freeDeliveryController.updateFreeDeliverySubCategories);
freeDeliveryRouter.patch('/products', freeDeliveryController.updateFreeDeliveryProducts);
