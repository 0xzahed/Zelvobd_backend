import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth';
import { subCategoryImageUpload } from '../../middlewares/upload';
import { subCategoryController } from './subcategory.controller';

export const subCategoryRouter = Router();

subCategoryRouter.get('/', subCategoryController.getSubCategoryList);
subCategoryRouter.get('/:id', subCategoryController.getSingleSubCategory);

subCategoryRouter.use(requireAdminAuth);

subCategoryRouter.post(
	'/',
	subCategoryImageUpload.single('image'),
	subCategoryController.createSubCategory
);
subCategoryRouter.patch(
	'/:id',
	subCategoryImageUpload.single('image'),
	subCategoryController.updateSubCategory
);
subCategoryRouter.delete('/:id', subCategoryController.deleteSubCategory);
