import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth';
import { youtubeVideoController } from './youtubeVideo.controller';

export const youtubeVideoRouter = Router();

youtubeVideoRouter.get('/', youtubeVideoController.getYoutubeVideoList);

youtubeVideoRouter.use(requireAdminAuth);

youtubeVideoRouter.post('/', youtubeVideoController.createYoutubeVideo);
youtubeVideoRouter.patch('/:id', youtubeVideoController.updateYoutubeVideo);
youtubeVideoRouter.delete('/:id', youtubeVideoController.deleteYoutubeVideo);
