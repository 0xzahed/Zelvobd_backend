import { Router } from 'express';
import { requireAdminAuth } from '../../middlewares/requireAdminAuth.js';
import { promoController } from './promo.controller.js';

export const promoRouter = Router();

// Public apply endpoint
promoRouter.post('/apply', promoController.applyPromo);

// Admin endpoints
promoRouter.use(requireAdminAuth);

promoRouter.get('/', promoController.getPromos);
promoRouter.post('/', promoController.createPromo);
promoRouter.patch('/:id', promoController.updatePromo);
promoRouter.delete('/:id', promoController.deletePromo);
