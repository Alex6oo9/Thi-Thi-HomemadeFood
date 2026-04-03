/**
 * Search Query Validator and Sanitizer
 *
 * Validates and sanitizes search queries to prevent regex injection
 * and ensure valid search parameters.
 */

const MIN_SEARCH_LENGTH = 3;
const MAX_SEARCH_LENGTH = 100;

/**
 * Escapes special regex characters to prevent regex injection
 *
 * @param str - String to escape
 * @returns Escaped string safe for use in regex
 */
export function escapeRegex(str: string): string {
  // Escape all special regex characters
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validates and sanitizes a search query
 *
 * Rules:
 * - Must be a string
 * - Minimum length: 3 characters (after trimming)
 * - Maximum length: 100 characters (after trimming)
 * - Whitespace is trimmed
 * - Special regex characters are escaped
 *
 * @param query - Raw search query from request
 * @returns Sanitized query string or null if invalid
 */
export function validateAndSanitizeSearch(query: any): string | null {
  // Check if query is a string
  if (typeof query !== 'string') {
    return null;
  }

  // Trim whitespace
  const trimmed = query.trim();

  // Check minimum length
  if (trimmed.length < MIN_SEARCH_LENGTH) {
    return null;
  }

  // Check maximum length
  if (trimmed.length > MAX_SEARCH_LENGTH) {
    return null;
  }

  // Escape special regex characters
  const escaped = escapeRegex(trimmed);

  return escaped;
}

/**
 * Type guard to check if a search query is valid
 *
 * @param query - Query to check
 * @returns True if query is valid
 */
export function isValidSearchQuery(query: any): boolean {
  return validateAndSanitizeSearch(query) !== null;
}
