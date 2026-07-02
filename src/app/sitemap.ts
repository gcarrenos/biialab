import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.biialab.org';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/courses`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contact`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/social-impact`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/casos/planvoyager`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
