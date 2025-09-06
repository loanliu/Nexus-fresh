import crypto from 'crypto';

/**
 * Generate a secure base64url token
 * @param length - Number of random bytes (default: 32)
 * @returns Base64url encoded token
 */
export function generateSecureToken(length: number = 32): string {
  const bytes = crypto.randomBytes(length);
  return bytes.toString('base64url');
}

/**
 * Generate an invite token with standard length
 * @returns Base64url encoded invite token
 */
export function generateInviteToken(): string {
  return generateSecureToken(32);
}

/**
 * Generate a shorter token for display purposes
 * @returns Short base64url token (8 characters)
 */
export function generateShortToken(): string {
  return generateSecureToken(6);
}

/**
 * Validate token format (base64url)
 * @param token - Token to validate
 * @returns boolean
 */
export function isValidTokenFormat(token: string): boolean {
  try {
    // Check if it's valid base64url
    const decoded = Buffer.from(token, 'base64url');
    return decoded.length > 0;
  } catch {
    return false;
  }
}
