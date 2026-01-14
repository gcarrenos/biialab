/**
 * Utility functions for handling images in the application
 */

/**
 * Generates a Lorem Picsum URL for placeholder images
 * @param width Width of the image
 * @param height Height of the image
 * @param id Optional unique ID to get a consistent image (if not provided, random seed will be used)
 * @returns URL string for the placeholder image
 */
export function getPlaceholderImage(width: number, height: number, id?: string | number): string {
  const randomSeed = id || Math.floor(Math.random() * 1000);
  return `https://picsum.photos/${width}/${height}?random=${randomSeed}`;
}

/**
 * Predefined image sizes for different components
 */
export const ImageSizes = {
  instructorAvatar: { width: 400, height: 400 },
  courseThumbnail: { width: 800, height: 450 },
  heroBackground: { width: 1920, height: 1080 },
  userAvatar: { width: 400, height: 400 },
}

/**
 * Get a course thumbnail placeholder
 * @param id Optional course ID for consistent images
 */
export function getCourseThumbnail(id?: string | number): string {
  return getPlaceholderImage(
    ImageSizes.courseThumbnail.width, 
    ImageSizes.courseThumbnail.height, 
    id
  );
}

/**
 * Get an instructor avatar placeholder
 * @param id Optional instructor ID for consistent images
 */
export function getInstructorAvatar(id?: string | number): string {
  return getPlaceholderImage(
    ImageSizes.instructorAvatar.width, 
    ImageSizes.instructorAvatar.height, 
    id
  );
}

/**
 * Get a user avatar placeholder
 * @param id Optional user ID for consistent images
 */
export function getUserAvatar(id?: string | number): string {
  return getPlaceholderImage(
    ImageSizes.userAvatar.width, 
    ImageSizes.userAvatar.height, 
    id
  );
}

/**
 * Get a hero background image
 */
export function getHeroImage(): string {
  return getPlaceholderImage(
    ImageSizes.heroBackground.width, 
    ImageSizes.heroBackground.height, 
    'hero'
  );
} 