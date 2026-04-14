import { Router } from 'express';

import { healthRouter } from '../modules/health/health.route';

export const router = Router();

router.use('/health', healthRouter);
