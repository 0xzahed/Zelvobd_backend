import { Router } from 'express';

import { authRouter } from '../modules/auth/auth.route';
import { categoryRouter } from '../modules/category/category.route';

import { healthRouter } from '../modules/health/health.route';
import { subCategoryRouter } from '../modules/subcategory/subcategory.route';
import { adminRouter } from '../modules/admin/admin.route';
import { productRouter } from '../modules/product/product.route';
import { bannerRouter } from '../modules/banner/banner.route';
import { flashSaleRouter } from '../modules/flashsale/flashsale.route';
import { freeDeliveryRouter } from '../modules/freeDelivery/freeDelivery.route';
import { topCatalogRouter } from '../modules/topCatalog/topCatalog.route';
import { youtubeVideoRouter } from '../modules/youtubeVideo/youtubeVideo.route';

export const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/categories', categoryRouter);
router.use('/subcategories', subCategoryRouter);
router.use('/admins', adminRouter);
router.use('/products', productRouter);
router.use('/banners', bannerRouter);
router.use('/flash-sales', flashSaleRouter);
router.use('/free-delivery', freeDeliveryRouter);
router.use('/top-catalog', topCatalogRouter);
router.use('/youtube-videos', youtubeVideoRouter);
