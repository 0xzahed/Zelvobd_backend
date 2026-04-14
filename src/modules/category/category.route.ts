import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth';
import { upload } from '../../middlewares/upload';
import { categoryController } from './category.controller';

export const categoryRouter = Router();

categoryRouter.get('/', categoryController.getCategoryList);

categoryRouter.use(requireAdminAuth);

categoryRouter.post('/', upload.single('image'), categoryController.createCategory);
categoryRouter.get('/:id', categoryController.getSingleCategory);
categoryRouter.patch('/:id', upload.single('image'), categoryController.updateCategory);
categoryRouter.delete('/:id', categoryController.deleteCategory);
