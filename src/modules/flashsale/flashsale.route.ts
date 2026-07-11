import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth.js';
import { flashSaleController } from './flashsale.controller.js';

export const flashSaleRouter = Router();

flashSaleRouter.get('/active', flashSaleController.getActiveFlashSaleCampaign);
flashSaleRouter.get('/active/products/all', flashSaleController.getAllActiveFlashSaleProducts);
flashSaleRouter.get('/active/products', flashSaleController.getActiveFlashSaleProducts);

flashSaleRouter.use(requireAdminAuth);

flashSaleRouter.post('/', flashSaleController.createFlashSaleCampaign);
flashSaleRouter.get('/', flashSaleController.getFlashSaleCampaignList);
flashSaleRouter.get('/:id', flashSaleController.getSingleFlashSaleCampaign);
flashSaleRouter.patch('/:id', flashSaleController.updateFlashSaleCampaign);
flashSaleRouter.patch('/:id/time', flashSaleController.updateFlashSaleCampaignTime);
flashSaleRouter.patch('/:id/products', flashSaleController.updateFlashSaleCampaignProducts);
flashSaleRouter.delete('/:id', flashSaleController.deleteFlashSaleCampaign);
