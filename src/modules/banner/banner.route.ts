import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth';
import { bannerImageUpload } from '../../middlewares/upload';
import { bannerController } from './banner.controller';

export const bannerRouter = Router();

bannerRouter.get('/', bannerController.getAllBanners);
bannerRouter.get('/home-page', bannerController.getHomePageBanners);
bannerRouter.get('/category/:categoryId', bannerController.getBannersByCategoryId);
bannerRouter.get('/:id', bannerController.getSingleBanner);

bannerRouter.use(requireAdminAuth);

bannerRouter.post('/', bannerImageUpload.single('image'), bannerController.createBanner);
bannerRouter.patch('/:id', bannerImageUpload.single('image'), bannerController.updateBanner);
bannerRouter.delete('/:id', bannerController.deleteBanner);
