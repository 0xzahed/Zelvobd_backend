import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth';
import { upload } from '../../middlewares/upload';
import { subCategoryController } from './subcategory.controller';

export const subCategoryRouter = Router();

subCategoryRouter.get('/', subCategoryController.getSubCategoryList);

subCategoryRouter.use(requireAdminAuth);

subCategoryRouter.post('/', upload.single('image'), subCategoryController.createSubCategory);
subCategoryRouter.get('/:id', subCategoryController.getSingleSubCategory);
subCategoryRouter.patch('/:id', upload.single('image'), subCategoryController.updateSubCategory);
subCategoryRouter.delete('/:id', subCategoryController.deleteSubCategory);
