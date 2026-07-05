import { Router } from 'express';
import { steadfastController } from './steadfast.controller.js';
import { requireAdminAuth } from '../../middlewares/requireAdminAuth.js';

export const steadfastRouter = Router();

// Only admin should be able to trigger fraud check and Steadfast sync
steadfastRouter.use(requireAdminAuth);

steadfastRouter.get('/fraud-check/:phone', steadfastController.checkFraudStatus);
steadfastRouter.get('/status/:invoice', steadfastController.checkDeliveryStatus);
steadfastRouter.post('/sync-orders', steadfastController.syncOrders);
