import { Router } from 'express';

import { categoryRouter } from '../modules/category/category.route';
import { healthRouter } from '../modules/health/health.route';

export const router = Router();

router.use('/health', healthRouter);
router.use('/categories', categoryRouter);
