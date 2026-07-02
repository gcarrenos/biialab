import type { MetadataRoute } from 'next';
import { getAllCourses } from '@/lib/db/actions/courses';

const BASE_URL = 'https://www.biialab.org';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/courses`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/social-impact`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/casos/planvoyager`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/privacidad`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/terminos`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  try {
    const courses = await getAllCourses();
    const courseEntries: MetadataRoute.Sitemap = courses.map((course) => ({
      url: `${BASE_URL}/courses/${course.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
    return [...staticEntries, ...courseEntries];
  } catch {
    return staticEntries;
  }
}
