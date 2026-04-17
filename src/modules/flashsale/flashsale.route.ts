import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth';
import { flashSaleController } from './flashsale.controller';

export const flashSaleRouter = Router();

flashSaleRouter.get('/active', flashSaleController.getActiveFlashSaleCampaign);
flashSaleRouter.get('/active/products', flashSaleController.getActiveFlashSaleProducts);

flashSaleRouter.use(requireAdminAuth);

flashSaleRouter.post('/', flashSaleController.createFlashSaleCampaign);
flashSaleRouter.get('/', flashSaleController.getFlashSaleCampaignList);
flashSaleRouter.get('/:id', flashSaleController.getSingleFlashSaleCampaign);
flashSaleRouter.patch('/:id/time', flashSaleController.updateFlashSaleCampaignTime);
flashSaleRouter.patch('/:id/products', flashSaleController.updateFlashSaleCampaignProducts);
flashSaleRouter.delete('/:id', flashSaleController.deleteFlashSaleCampaign);
