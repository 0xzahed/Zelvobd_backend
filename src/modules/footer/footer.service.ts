import { prisma } from '../../lib/prisma.js';
import type { FooterSettingsInput } from './footer.validation.js';

const DEFAULT_FOOTER_DATA = {
  brandName: 'ZELVO BD',
  brandTagline: 'All Types of Home & Kitchen Appliances Available',
  logoUrl: '/logo.png',
  supportEmail: 'support@zelvobd.com',
  supportPhone: '+8801994040246',
  supportAddress: '136/137, Mudi Market, 2nd Floor, Kachabazar, Dhaka New Market, Dhaka - 1205',
  navGroups: [
    {
      title: 'Shop',
      links: [
        { label: 'All Products', href: '/search' },
        { label: 'Categories', href: '/categories' },
        { label: 'Offers', href: '/offers' },
        { label: 'Flash Sale', href: '/offers' }
      ]
    },
    {
      title: 'Account',
      links: [
        { label: 'Help & Support', href: '/support' },
        { label: 'More', href: '/more' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '#' },
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' }
      ]
    }
  ],
  socials: [
    { label: 'Facebook', href: 'https://www.facebook.com/share/17t5znWx2J', icon: 'facebook' },
    { label: 'Instagram', href: 'https://www.instagram.com/zelvobd/', icon: 'instagram' },
    { label: 'Twitter', href: 'https://twitter.com/zelvobd', icon: 'twitter' },
    { label: 'YouTube', href: 'https://www.youtube.com/@zelvobd', icon: 'youtube' }
  ]
};

const ensureFooter = async () => {
  return prisma.footerConfig.upsert({
    where: { id: 'main' },
    update: {},
    create: { id: 'main', data: DEFAULT_FOOTER_DATA }
  });
};

export const getFooterData = async () => {
  const config = await ensureFooter();
  return config.data as typeof DEFAULT_FOOTER_DATA;
};

export const updateFooterData = async (data: FooterSettingsInput) => {
  const config = await prisma.footerConfig.upsert({
    where: { id: 'main' },
    update: { data: data as any },
    create: { id: 'main', data: data as any }
  });
  return config.data as typeof DEFAULT_FOOTER_DATA;
};
