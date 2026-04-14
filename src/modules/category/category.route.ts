import { Router } from 'express';

import { upload } from '../../middlewares/upload';
import { categoryController } from './category.controller';

export const categoryRouter = Router();

categoryRouter.post('/', upload.single('image'), categoryController.createCategory);
categoryRouter.get('/', categoryController.getCategoryList);
categoryRouter.get('/:id', categoryController.getSingleCategory);
categoryRouter.patch('/:id', upload.single('image'), categoryController.updateCategory);
categoryRouter.delete('/:id', categoryController.deleteCategory);
