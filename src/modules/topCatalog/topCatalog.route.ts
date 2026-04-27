import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth.js';
import { topCatalogController } from './topCatalog.controller.js';

export const topCatalogRouter = Router();

topCatalogRouter.get('/', topCatalogController.getTopCatalogProducts);

topCatalogRouter.use(requireAdminAuth);

topCatalogRouter.put('/', topCatalogController.replaceTopCatalogCategories);
