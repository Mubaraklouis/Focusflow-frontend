/**
 * @fileoverview Profile utility functions composable
 * @module composables/Profile/useProfileUtils
 * @description
 * Provides utility functions for formatting and transforming profile data.
 * These functions are stateless and can be used throughout the profile feature.
 *
 * @example
 * ```typescript
 * import { useProfileUtils } from '~/composables/Profile'
 *
 * const { formatDate, getInitials } = useProfileUtils()
 *
 * const formattedDate = formatDate('2025-01-15')
 * // Output: "Jan 15, 2025"
 *
 * const initials = getInitials('John Doe')
 * // Output: "JD"
 * ```
 */

/**
 * Date format options for profile dates
 */
export interface DateFormatOptions {
    /** Include the day in the formatted date */
    includeDay?: boolean;
    /** Date format style: 'short' (Jan), 'long' (January) */
    monthFormat?: 'short' | 'long';
}

/**
 * Profile utility functions composable
 *
 * @description
 * Provides helper functions for common profile data transformations.
 * All functions are pure and have no side effects.
 *
 * @returns Object containing utility functions
 *
 * @example
 * ```typescript
 * const { formatDate, getInitials, formatWebsiteUrl } = useProfileUtils()
 * ```
 */
export function useProfileUtils() {
    /**
     * Formats a date string into a human-readable format
     *
     * @description
     * Converts an ISO date string (YYYY-MM-DD) into a localized,
     * human-readable format. Returns an empty string if the input is invalid.
     *
     * @param dateString - ISO format date string (e.g., "2025-01-15")
     * @param options - Optional formatting options
     * @returns Formatted date string (e.g., "Jan 15, 2025")
     *
     * @example
     * ```typescript
     * formatDate('2025-01-15')
     * // Returns: "Jan 15, 2025"
     *
     * formatDate('2025-01-15', { includeDay: false })
     * // Returns: "Jan 2025"
     *
     * formatDate('2025-01-15', { monthFormat: 'long' })
     * // Returns: "January 15, 2025"
     *
     * formatDate('')
     * // Returns: ""
     * ```
     */
    const formatDate = (
        dateString: string,
        options: DateFormatOptions = {}
    ): string => {
        if (!dateString) {
            return '';
        }

        const { includeDay = true, monthFormat = 'short' } = options;

        try {
            const date = new Date(dateString);

            // Check for invalid date
            if (isNaN(date.getTime())) {
                return '';
            }

            const formatOptions: Intl.DateTimeFormatOptions = {
                month: monthFormat,
                year: 'numeric',
            };

            if (includeDay) {
                formatOptions.day = 'numeric';
            }

            return date.toLocaleDateString('en-US', formatOptions);
        } catch {
            return '';
        }
    };

    /**
     * Extracts initials from a full name
     *
     * @description
     * Takes a full name string and returns the uppercase initials.
     * Handles single names, multiple names, and edge cases gracefully.
     * Returns a maximum of 2 characters.
     *
     * @param name - Full name string (e.g., "John Doe")
     * @returns Uppercase initials (e.g., "JD"), or "U" if name is empty
     *
     * @example
     * ```typescript
     * getInitials('John Doe')
     * // Returns: "JD"
     *
     * getInitials('John')
     * // Returns: "J"
     *
     * getInitials('John Michael Doe')
     * // Returns: "JM" (first two initials only)
     *
     * getInitials('')
     * // Returns: "U" (default fallback)
     *
     * getInitials('  ')
     * // Returns: "U" (handles whitespace-only strings)
     * ```
     */
    const getInitials = (name: string): string => {
        if (!name || !name.trim()) {
            return 'U';
        }

        const words = name.trim().split(/\s+/).filter(w => w.length > 0);
        
        if (words.length === 0) {
            return 'U';
        }
        
        // If multiple words, use first letter of first and last word (e.g., "John Doe" -> "JD")
        if (words.length >= 2) {
            const firstInitial = words[0]?.charAt(0) || '';
            const lastInitial = words[words.length - 1]?.charAt(0) || '';
            return (firstInitial + lastInitial).toUpperCase();
        }
        
        // If single word, return first two letters (e.g., "John" -> "JO")
        return (words[0] || '').substring(0, 2).toUpperCase();
    };

    /**
     * Formats a website URL for display
     *
     * @description
     * Removes the protocol (http:// or https://) from a URL
     * for cleaner display in the UI. Also removes trailing slashes.
     *
     * @param url - Full URL string
     * @returns URL without protocol prefix
     *
     * @example
     * ```typescript
     * formatWebsiteUrl('https://johndoe.dev')
     * // Returns: "johndoe.dev"
     *
     * formatWebsiteUrl('http://example.com/')
     * // Returns: "example.com"
     *
     * formatWebsiteUrl('')
     * // Returns: ""
     * ```
     */
    const formatWebsiteUrl = (url: string): string => {
        if (!url) {
            return '';
        }

        return url
            .replace(/^https?:\/\//, '')
            .replace(/\/$/, '');
    };

    /**
     * Validates an email address format
     *
     * @description
     * Performs basic email format validation using a regex pattern.
     * This is a client-side check only; server validation is still required.
     *
     * @param email - Email address to validate
     * @returns True if email format is valid
     *
     * @example
     * ```typescript
     * isValidEmail('john@example.com')
     * // Returns: true
     *
     * isValidEmail('invalid-email')
     * // Returns: false
     * ```
     */
    const isValidEmail = (email: string): boolean => {
        if (!email) {
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    /**
     * Validates a website URL format
     *
     * @description
     * Checks if a string is a valid URL with http or https protocol.
     *
     * @param url - URL string to validate
     * @returns True if URL format is valid
     *
     * @example
     * ```typescript
     * isValidUrl('https://example.com')
     * // Returns: true
     *
     * isValidUrl('example.com')
     * // Returns: false (missing protocol)
     * ```
     */
    const isValidUrl = (url: string): boolean => {
        if (!url) {
            return false;
        }

        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    };

    return {
        formatDate,
        getInitials,
        formatWebsiteUrl,
        isValidEmail,
        isValidUrl,
    };
}
