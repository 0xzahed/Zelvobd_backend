import { Router } from 'express';

import { optionalAdminAuth } from '../../middlewares/optionalAdminAuth.js';
import { requireAdminAuth } from '../../middlewares/requireAdminAuth.js';
import { productMediaUpload } from '../../middlewares/upload.js';
import { productController } from './product.controller.js';

export const productRouter = Router();

productRouter.get('/', optionalAdminAuth, productController.getProductList);
productRouter.get('/scan/:code', productController.scanBarcode);
productRouter.get('/slug/:slug', optionalAdminAuth, productController.getProductBySlug);
productRouter.get('/:id', productController.getSingleProduct);

productRouter.use(requireAdminAuth);

productRouter.post(
  '/',
  productMediaUpload.fields([
    { name: 'variantImages', maxCount: 50 },
    { name: 'video', maxCount: 1 }
  ]),
  productController.createProduct
);

productRouter.patch(
  '/:id',
  productMediaUpload.fields([
    { name: 'variantImages', maxCount: 50 },
    { name: 'video', maxCount: 1 }
  ]),
  productController.updateProduct
);

productRouter.delete('/:id', productController.deleteProduct);
productRouter.post('/:id/copy', productController.copyProduct);
productRouter.post('/:id/regenerate-barcodes', productController.regenerateBarcodes);
