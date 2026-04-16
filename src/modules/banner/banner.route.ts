import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth';
import { bannerImageUpload } from '../../middlewares/upload';
import { bannerController } from './banner.controller';

export const bannerRouter = Router();

bannerRouter.get('/', bannerController.getAllBanners);

bannerRouter.use(requireAdminAuth);

bannerRouter.post('/', bannerImageUpload.single('image'), bannerController.createBanner);
bannerRouter.get('/:id', bannerController.getSingleBanner);
bannerRouter.patch('/:id', bannerImageUpload.single('image'), bannerController.updateBanner);
bannerRouter.delete('/:id', bannerController.deleteBanner);
