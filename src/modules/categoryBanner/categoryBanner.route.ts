import { Router } from 'express';
import { categoryBannerController } from './categoryBanner.controller.js';
import { categoryBannerImageUpload } from '../../middlewares/upload.js';

export const categoryBannerRouter = Router();

categoryBannerRouter.get('/', categoryBannerController.getCategoryBanners);

categoryBannerRouter.post(
  '/',
  categoryBannerImageUpload.single('image'),
  categoryBannerController.createCategoryBanner
);

categoryBannerRouter.patch(
  '/:id',
  categoryBannerImageUpload.single('image'),
  categoryBannerController.updateCategoryBanner
);

categoryBannerRouter.delete('/:id', categoryBannerController.deleteCategoryBanner);
