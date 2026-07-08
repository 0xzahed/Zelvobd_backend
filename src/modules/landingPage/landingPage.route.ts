import { Router } from 'express';
import { requireAdminAuth } from '../../middlewares/requireAdminAuth.js';
import { LandingPageController } from './landingPage.controller.js';

const router = Router();

// Public read
router.get('/', LandingPageController.getAllLandingPages);
router.get('/slug/:slug', LandingPageController.getLandingPageBySlug);
router.get('/:id', LandingPageController.getLandingPageById);

// Admin write
router.post(
  '/',
  requireAdminAuth,
  LandingPageController.createLandingPage
);

router.patch(
  '/:id',
  requireAdminAuth,
  LandingPageController.updateLandingPage
);

router.delete(
  '/:id',
  requireAdminAuth,
  LandingPageController.deleteLandingPage
);

export const landingPageRouter = router;
