import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth.js';
import { subCategoryImageUpload } from '../../middlewares/upload.js';
import { subCategoryController } from './subcategory.controller.js';

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
