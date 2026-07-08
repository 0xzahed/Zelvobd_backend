import { z } from 'zod';

const createLandingPageSchema = z.object({
  body: z.object({
    slug: z.string().min(1, 'Slug is required'),
    colorPalette: z.string().optional(),
    productId: z.string().optional(),
    heroSection: z.any().optional(),
    tableSection: z.any().optional(),
    featureCards: z.any().optional(),
    timerSection: z.any().optional(),
    videoSection: z.any().optional(),
    bulletPointsSection: z.any().optional(),
    tipsSection: z.any().optional(),
    checkoutSection: z.any().optional(),
    faqSection: z.any().optional(),
    whatsappSection: z.any().optional(),
  }),
});

const updateLandingPageSchema = z.object({
  body: z.object({
    slug: z.string().optional(),
    colorPalette: z.string().optional(),
    productId: z.string().optional(),
    heroSection: z.any().optional(),
    tableSection: z.any().optional(),
    featureCards: z.any().optional(),
    timerSection: z.any().optional(),
    videoSection: z.any().optional(),
    bulletPointsSection: z.any().optional(),
    tipsSection: z.any().optional(),
    checkoutSection: z.any().optional(),
    faqSection: z.any().optional(),
    whatsappSection: z.any().optional(),
  }),
});

export const LandingPageValidation = {
  createLandingPageSchema,
  updateLandingPageSchema,
};
