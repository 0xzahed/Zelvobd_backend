import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth';
import { productMediaUpload } from '../../middlewares/upload';
import { productController } from './product.controller';

export const productRouter = Router();


productRouter.use(requireAdminAuth);

productRouter.get('/', productController.getProductList);
productRouter.get('/:id', productController.getSingleProduct);
productRouter.post(
  '/',
  productMediaUpload.fields([
    { name: 'variantImages', maxCount: 50 },
    { name: 'video', maxCount: 1 }
  ]),
  productController.createProduct
);

productRouter.put(
  '/:id',
  productMediaUpload.fields([
    { name: 'variantImages', maxCount: 50 },
    { name: 'video', maxCount: 1 }
  ]),
  productController.updateProduct
);

productRouter.delete('/:id', productController.deleteProduct);
productRouter.post('/:id/copy', productController.copyProduct);
