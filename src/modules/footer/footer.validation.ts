import { z } from 'zod';

const footerNavLinkSchema = z.object({
  label: z.string().trim().min(1, 'Link label is required'),
  href: z.string().trim().min(1, 'Link href is required')
});

const footerNavGroupSchema = z.object({
  title: z.string().trim().min(1, 'Nav group title is required'),
  links: z.array(footerNavLinkSchema).min(1, 'At least one link is required')
});

const footerSocialSchema = z.object({
  label: z.string().trim().min(1, 'Social label is required'),
  href: z.string().trim().min(1, 'Social href is required'),
  icon: z.enum(['facebook', 'instagram', 'twitter', 'youtube', '']).optional()
});

export const footerSettingsSchema = z.object({
  brandName: z.string().trim().min(1, 'Brand name is required'),
  brandTagline: z.string().trim().optional().default(''),
  logoUrl: z.string().trim().optional().default(''),
  supportEmail: z.string().trim().optional().default(''),
  supportPhone: z.string().trim().optional().default(''),
  supportAddress: z.string().trim().optional().default(''),
  navGroups: z.array(footerNavGroupSchema).optional().default([]),
  socials: z.array(footerSocialSchema).optional().default([])
});

export const updateFooterSchema = footerSettingsSchema;

export type FooterSettingsInput = z.infer<typeof footerSettingsSchema>;
