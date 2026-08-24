import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.legacylandandcattleco.com';

/** Only the public marketing pages — customer order pages stay out of search. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' }[] = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/weight-explainer', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/select-animal', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/select-size', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/wagyu-waitlist', priority: 0.5, changeFrequency: 'monthly' },
  ];

  const lastModified = new Date();
  return pages.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
