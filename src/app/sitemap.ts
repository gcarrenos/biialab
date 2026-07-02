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
