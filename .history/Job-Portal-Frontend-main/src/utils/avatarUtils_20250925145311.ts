/**
 * Avatar generation utilities using DiceBear API
 * Provides deterministic, gender-neutral avatars for users
 */

export interface AvatarOptions {
  seed: string;
  mode?: 'robot' | 'elegant';
  format?: 'svg' | 'png';
  size?: number;
  background?: string;
}

/**
 * Generate avatar URL using DiceBear API
 * @param options Avatar generation options
 * @returns Avatar URL string
 */
export function generateAvatarUrl(options: AvatarOptions): string {
  const {
    seed,
    mode = 'robot',
    format = 'svg',
    size = 256,
    background
  } = options;

  // Handle null/undefined seed with fallback
  const safeSeed = seed || 'guest';
  // Normalize seed: lowercase, trim, URL encode
  const normalizedSeed = encodeURIComponent(safeSeed.toString().toLowerCase().trim());

  // Use bottts-neutral for all avatars for consistency
  const style = 'bottts-neutral'; // Gender-neutral robot style for all

  // Build base URL
  let url = `https://api.dicebear.com/7.x/${style}/svg?seed=${normalizedSeed}`;

  // Add background if specified
  if (background) {
    url += `&backgroundColor=${background}`;
  }

  return url;
}

/**
 * Generate fallback avatar URL using RoboHash
 * @param seed User identifier
 * @returns RoboHash avatar URL
 */
export function generateFallbackAvatarUrl(seed: string): string {
  const safeSeed = seed || 'guest';
  const normalizedSeed = encodeURIComponent(safeSeed.toString().toLowerCase().trim());
  return `https://robohash.org/${normalizedSeed}.png?set=set4&size=256x256`;
}

/**
 * Get avatar URL with fallback handling
 * @param userIdentifier User email, ID, or name
 * @param options Avatar options
 * @returns Promise resolving to avatar URL
 */
export async function getAvatarUrl(
  userIdentifier: string,
  options: Omit<AvatarOptions, 'seed'> = {}
): Promise<string> {
  const avatarOptions: AvatarOptions = {
    seed: userIdentifier,
    ...options
  };

  try {
    // Try DiceBear first
    const diceBearUrl = generateAvatarUrl(avatarOptions);

    // Test if URL is accessible (optional - for production you might skip this)
    // For now, just return the URL assuming DiceBear is available
    return diceBearUrl;
  } catch (error) {
    console.warn('DiceBear avatar generation failed, using fallback:', error);
    // Fallback to RoboHash
    return generateFallbackAvatarUrl(userIdentifier);
  }
}

/**
 * Generate avatar URL synchronously (for immediate use)
 * @param userIdentifier User identifier
 * @param mode Avatar style mode
 * @returns Avatar URL string
 */
export function getAvatarUrlSync(
  userIdentifier: string,
  mode: 'robot' | 'elegant' = 'robot'
): string {
  return generateAvatarUrl({
    seed: userIdentifier,
    mode,
    format: 'svg'
  });
}

/**
 * Preload avatar image
 * @param url Avatar URL to preload
 */
export function preloadAvatar(url: string): void {
  const img = new Image();
  img.src = url;
}

/**
 * Generate accessibility attributes for avatar
 * @param userName User's display name
 * @returns Object with accessibility attributes
 */
export function getAvatarAccessibilityAttrs(userName: string) {
  return {
    alt: `Avatar de ${userName}`,
    role: 'img',
    'aria-label': `Avatar de usuario ${userName}`
  };
}