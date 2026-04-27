import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth.js';
import { youtubeVideoController } from './youtubeVideo.controller.js';

export const youtubeVideoRouter = Router();

youtubeVideoRouter.get('/', youtubeVideoController.getYoutubeVideoList);

youtubeVideoRouter.use(requireAdminAuth);

youtubeVideoRouter.post('/', youtubeVideoController.createYoutubeVideo);
youtubeVideoRouter.patch('/:id', youtubeVideoController.updateYoutubeVideo);
youtubeVideoRouter.delete('/:id', youtubeVideoController.deleteYoutubeVideo);
