import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth';
import { productMediaUpload } from '../../middlewares/upload';
import { productController } from './product.controller';

export const productRouter = Router();

productRouter.use(requireAdminAuth);

productRouter.post(
  '/',
  productMediaUpload.fields([
    { name: 'variantImages', maxCount: 50 },
    { name: 'video', maxCount: 1 }
  ]),
  productController.createProduct
);
