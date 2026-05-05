import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth.js';
import { trendingController } from './trending.controller.js';

export const trendingRouter = Router();

trendingRouter.get('/', trendingController.getTrending);

trendingRouter.use(requireAdminAuth);

trendingRouter.get('/admin', trendingController.getTrendingAdmin);
trendingRouter.patch('/campaign', trendingController.updateTrendingCampaign);
trendingRouter.patch('/categories', trendingController.updateTrendingCategories);
trendingRouter.patch('/sub-categories', trendingController.updateTrendingSubCategories);
trendingRouter.patch('/products', trendingController.updateTrendingProducts);
