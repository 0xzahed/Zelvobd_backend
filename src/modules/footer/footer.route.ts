import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth.js';
import { footerController } from './footer.controller.js';

export const footerRouter = Router();

footerRouter.get('/', footerController.getFooter);

footerRouter.use(requireAdminAuth);

footerRouter.patch('/', footerController.patchFooter);
