import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth';
import { topCatalogController } from './topCatalog.controller';

export const topCatalogRouter = Router();

topCatalogRouter.get('/', topCatalogController.getTopCatalogProducts);

topCatalogRouter.use(requireAdminAuth);

topCatalogRouter.put('/', topCatalogController.replaceTopCatalogCategories);
