import { Router } from 'express';
import { requireAdminAuth } from '../../middlewares/requireAdminAuth.js';
import { richTextImageUpload, adminImageUpload } from '../../middlewares/upload.js';
import { uploadController } from './upload.controller.js';

export const uploadRouter = Router();

uploadRouter.use(requireAdminAuth);
uploadRouter.post('/rich-text', richTextImageUpload.single('image'), uploadController.uploadRichTextImage);
uploadRouter.post('/image', adminImageUpload.single('image'), uploadController.uploadImage);
