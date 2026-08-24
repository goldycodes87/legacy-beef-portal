import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.legacylandandcattleco.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Everything past the reservation form is personal to one customer.
      disallow: ['/api/', '/session/', '/access/', '/contract', '/payment', '/book', '/join/', '/auth'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
