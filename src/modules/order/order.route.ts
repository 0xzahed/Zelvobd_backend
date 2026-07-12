import { Router } from 'express';
import { requireAdminAuth } from '../../middlewares/requireAdminAuth.js';
import { orderController } from './order.controller.js';

export const orderRouter = Router();

// Public checkout endpoint
orderRouter.post('/checkout', orderController.checkout);
orderRouter.post('/checkout-landing-page', orderController.checkoutLandingPage);

// Admin endpoints
orderRouter.use(requireAdminAuth);

orderRouter.get('/', orderController.getOrders);
orderRouter.get('/:id', orderController.getSingleOrder);
orderRouter.patch('/:id/status', orderController.updateOrderStatus);
orderRouter.patch('/:id', orderController.updateOrder);
orderRouter.delete('/:id', orderController.deleteOrder);
