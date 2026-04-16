import { Router } from 'express';

import { authRouter } from '../modules/auth/auth.route';
import { categoryRouter } from '../modules/category/category.route';

import { healthRouter } from '../modules/health/health.route';
import { subCategoryRouter } from '../modules/subcategory/subcategory.route';
import { adminRouter } from '../modules/admin/admin.route';
import { productRouter } from '../modules/product/product.route';
import { bannerRouter } from '../modules/banner/banner.route';

export const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/categories', categoryRouter);
router.use('/subcategories', subCategoryRouter);
router.use('/admins', adminRouter);
router.use('/products', productRouter);
router.use('/banners', bannerRouter);
