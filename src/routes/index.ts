import { Router } from 'express';

import { authRouter } from '../modules/auth/auth.route.js';
import { categoryRouter } from '../modules/category/category.route.js';

import { healthRouter } from '../modules/health/health.route.js';
import { subCategoryRouter } from '../modules/subcategory/subcategory.route.js';
import { adminRouter } from '../modules/admin/admin.route.js';
import { productRouter } from '../modules/product/product.route.js';
import { bannerRouter } from '../modules/banner/banner.route.js';
import { flashSaleRouter } from '../modules/flashsale/flashsale.route.js';
import { freeDeliveryRouter } from '../modules/freeDelivery/freeDelivery.route.js';
import { topCatalogRouter } from '../modules/topCatalog/topCatalog.route.js';
import { youtubeVideoRouter } from '../modules/youtubeVideo/youtubeVideo.route.js';
import { trendingRouter } from '../modules/trending/trending.route.js';
import { uploadRouter } from '../modules/upload/upload.route.js';
import { promoRouter } from '../modules/promo/promo.route.js';
import { orderRouter } from '../modules/order/order.route.js';
import { categoryBannerRouter } from '../modules/categoryBanner/categoryBanner.route.js';
import { steadfastRouter } from '../modules/steadfast/steadfast.route.js';

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
router.use('/trending', trendingRouter);
router.use('/uploads', uploadRouter);
router.use('/promos', promoRouter);
router.use('/orders', orderRouter);
router.use('/category-banners', categoryBannerRouter);
router.use('/steadfast', steadfastRouter);
