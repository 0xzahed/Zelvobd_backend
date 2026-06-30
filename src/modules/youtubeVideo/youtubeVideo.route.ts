import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/requireAdminAuth.js';
import { youtubeVideoImageUpload } from '../../middlewares/upload.js';
import { youtubeVideoController } from './youtubeVideo.controller.js';

export const youtubeVideoRouter = Router();

youtubeVideoRouter.get('/', youtubeVideoController.getYoutubeVideoList);

youtubeVideoRouter.use(requireAdminAuth);

youtubeVideoRouter.post('/', youtubeVideoImageUpload.single('image'), youtubeVideoController.createYoutubeVideo);
youtubeVideoRouter.patch('/:id', youtubeVideoImageUpload.single('image'), youtubeVideoController.updateYoutubeVideo);
youtubeVideoRouter.delete('/:id', youtubeVideoController.deleteYoutubeVideo);
