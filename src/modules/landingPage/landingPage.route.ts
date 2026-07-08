import express from 'express';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { LandingPageController } from './landingPage.controller.js';
import { LandingPageValidation } from './landingPage.validation.js';

const router = express.Router();

router.post(
  '/',
  validateRequest(LandingPageValidation.createLandingPageSchema),
  LandingPageController.createLandingPage
);

router.get('/', LandingPageController.getAllLandingPages);

router.get('/slug/:slug', LandingPageController.getLandingPageBySlug);

router.get('/:id', LandingPageController.getLandingPageById);

router.patch(
  '/:id',
  validateRequest(LandingPageValidation.updateLandingPageSchema),
  LandingPageController.updateLandingPage
);

router.delete('/:id', LandingPageController.deleteLandingPage);

export const landingPageRouter = router;
