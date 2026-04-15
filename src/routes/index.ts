import { Router } from 'express';

import { authRouter } from '../modules/auth/auth.route';
import { categoryRouter } from '../modules/category/category.route';

import { healthRouter } from '../modules/health/health.route';
import { subCategoryRouter } from '../modules/subcategory/subcategory.route';
import { adminRouter } from '../modules/admin/admin.route';

export const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/categories', categoryRouter);
router.use('/subcategories', subCategoryRouter);
router.use('/admins', adminRouter);
