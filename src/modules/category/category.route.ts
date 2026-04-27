import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth.js';
import { categoryImageUpload } from '../../middlewares/upload.js';
import { categoryController } from './category.controller.js';

export const categoryRouter = Router();

categoryRouter.get('/', categoryController.getCategoryList);
categoryRouter.get('/:id', categoryController.getSingleCategory);

categoryRouter.use(requireAdminAuth);

categoryRouter.post('/', categoryImageUpload.single('image'), categoryController.createCategory);
categoryRouter.patch('/:id', categoryImageUpload.single('image'), categoryController.updateCategory);
categoryRouter.delete('/:id', categoryController.deleteCategory);
