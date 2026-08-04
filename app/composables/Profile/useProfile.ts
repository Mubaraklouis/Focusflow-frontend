/**
 * @fileoverview Core profile state management composable
 * @module composables/Profile/useProfile
 * @description
 * Provides centralized, reactive state management for user profile data.
 * Built on Nuxt's useState for SSR compatibility and hydration support.
 *
 * This composable serves as the single source of truth for profile data
 * across the application. Other profile-related composables depend on this
 * for reading and updating profile state.
 *
 * @example
 * ```typescript
 * import { useProfile } from '~/composables/Profile'
 *
 * const { profile, isLoading, error } = useProfile()
 *
 * // Access profile data reactively
 * console.log(profile.value.name)
 *
 * // Check loading state
 * if (isLoading.value) {
 *   console.log('Loading profile...')
 * }
 * ```
 */

/**
 * Represents a user achievement badge
 *
 * @interface Achievement
 * @description
 * Achievements are earned by users for completing specific milestones
 * or tasks within the application.
 */
export interface Achievement {
    /** Unique identifier for the achievement */
    id: string;
    /** Display title of the achievement */
    title: string;
    /** Brief description of how to earn this achievement */
    description: string;
    /** Emoji or icon representing the achievement */
    icon: string;
    /** ISO date string when the achievement was earned */
    earnedDate: string;
}

/**
 * Represents a complete user profile
 *
 * @interface UserProfile
 * @description
 * Contains all user profile information displayed on the profile page
 * and used throughout the application.
 */
export interface UserProfile {
    /** Unique user identifier */
    id: string;
    /** User's full display name */
    name: string;
    /** User's email address */
    email: string;
    /** Unique username handle (without @) */
    username: string;
    /** User's bio or about text */
    bio: string;
    /** URL to user's avatar image */
    avatar: string;
    /** User's location (city, country, etc.) */
    location: string;
    /** User's personal website URL */
    website: string;
    /** User's role: 'student', 'teacher', or 'admin' */
    role: string;
    /** ISO date string of when user joined */
    joinedDate: string;
    /** List of achievements earned by the user */
    achievements: Achievement[];
}

/**
 * Default empty profile state
 * @internal
 */
const DEFAULT_PROFILE: Readonly<UserProfile> = Object.freeze({
    id: '',
    name: '',
    email: '',
    username: '',
    bio: '',
    avatar: '',
    location: '',
    website: '',
    role: 'student',
    joinedDate: '',
    achievements: [],
});

/**
 * State keys for Nuxt's useState
 * @internal
 */
const STATE_KEYS = {
    PROFILE: 'user-profile',
    LOADING: 'profile-loading',
    ERROR: 'profile-error',
} as const;

/**
 * Core profile state management composable
 *
 * @description
 * Manages the reactive profile state using Nuxt's useState for SSR support.
 * Provides methods to read, update, and reset profile data.
 *
 * **State Management:**
 * - `profile` - The current user profile data
 * - `isLoading` - Whether profile data is being fetched
 * - `error` - Error message if profile fetch failed
 *
 * **Methods:**
 * - `setProfile()` - Update profile with partial data
 * - `resetProfile()` - Reset profile to default empty state
 * - `setLoading()` - Update loading state
 * - `setError()` - Update error state
 *
 * @returns Profile state and methods
 *
 * @example
 * ```typescript
 * // Basic usage
 * const { profile, isLoading } = useProfile()
 *
 * // Update profile data
 * const { setProfile } = useProfile()
 * setProfile({ name: 'New Name', bio: 'Updated bio' })
 *
 * // Reset profile (e.g., on logout)
 * const { resetProfile } = useProfile()
 * resetProfile()
 * ```
 */
export function useProfile() {
    /**
     * Reactive profile data state
     * @remarks SSR-safe using Nuxt's useState
     */
    const profile = useState<UserProfile>(
        STATE_KEYS.PROFILE,
        () => ({ ...DEFAULT_PROFILE })
    );

    /**
     * Loading state indicator
     * @remarks True while profile data is being fetched
     */
    const isLoading = useState<boolean>(
        STATE_KEYS.LOADING,
        () => false
    );

    /**
     * Error state for profile operations
     * @remarks Contains error message or null if no error
     */
    const error = useState<string | null>(
        STATE_KEYS.ERROR,
        () => null
    );

    /**
     * Updates profile with partial data
     *
     * @description
     * Merges the provided data with the existing profile state.
     * Only updates the fields that are provided.
     *
     * @param data - Partial profile data to merge
     *
     * @example
     * ```typescript
     * setProfile({ name: 'John', bio: 'Developer' })
     * // Only name and bio are updated, other fields remain unchanged
     * ```
     */
    const setProfile = (data: Partial<UserProfile>): void => {
        profile.value = { ...profile.value, ...data };
    };

    /**
     * Resets profile to default empty state
     *
     * @description
     * Clears all profile data and resets error state.
     * Useful when user logs out or profile needs to be cleared.
     *
     * @example
     * ```typescript
     * // On logout
     * resetProfile()
     * ```
     */
    const resetProfile = (): void => {
        profile.value = { ...DEFAULT_PROFILE };
        error.value = null;
    };

    /**
     * Updates the loading state
     *
     * @param value - New loading state
     */
    const setLoading = (value: boolean): void => {
        isLoading.value = value;
    };

    /**
     * Updates the error state
     *
     * @param message - Error message or null to clear
     */
    const setError = (message: string | null): void => {
        error.value = message;
    };

    return {
        profile,
        isLoading,
        error,
        setProfile,
        resetProfile,
        setLoading,
        setError,
    };
}
