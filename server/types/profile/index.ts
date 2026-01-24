/**
 * @fileoverview Server-side type definitions for user profile
 * @module server/types/profile
 * @description
 * Type definitions for profile-related API responses from Laravel backend.
 * These types match the structure returned by Laravel's user endpoint.
 */

/**
 * User data from Laravel backend
 *
 * @interface UserData
 * @description
 * Represents the authenticated user data from Laravel.
 */
export interface UserData {
    /** Unique user identifier */
    id: number;
    /** User's full name */
    name: string;
    /** User's email address */
    email: string;
    /** Account creation timestamp */
    created_at: string;
    /** Last update timestamp */
    updated_at: string;
    /** User's username/handle */
    username?: string;
    /** User's bio or about text */
    bio?: string;
    /** URL to user's avatar image */
    avatar?: string;
    /** User's location */
    location?: string;
    /** User's website URL */
    website?: string;
}

/**
 * User profile response from Laravel backend
 *
 * @interface UserProfileResponse
 * @description
 * Represents the response structure from Laravel's /api/user endpoint.
 * Laravel wraps the user data in a status/data structure.
 */
export interface UserProfileResponse {
    /** Response status */
    status: string;
    /** User data */
    data: UserData;
}

/**
 * Extended user profile with additional fields
 *
 * @interface ExtendedUserProfile
 * @description
 * Extended profile data that may include additional fields
 * from a dedicated profile endpoint.
 */
export interface ExtendedUserProfile extends UserData {
}

/**
 * Profile API error response
 *
 * @interface ProfileErrorResponse
 * @description
 * Error response structure from profile-related API calls.
 */
export interface ProfileErrorResponse {
    /** Error message */
    message: string;
    /** Validation errors (keyed by field name) */
    errors?: Record<string, string[]>;
}

/**
 * Payload for updating user profile
 *
 * @interface UserUpdatePayload
 * @description
 * Data structure for profile update requests.
 * All fields are optional - only include fields to update.
 */
export interface UserUpdatePayload {
    /** User's full name */
    name?: string;
    /** User's username/handle */
    username?: string;
    /** User's bio or about text */
    bio?: string;
    /** URL to user's avatar image */
    avatar?: string;
    /** User's location */
    location?: string;
    /** User's website URL */
    website?: string;
}

/**
 * User update response from Laravel backend
 *
 * @interface UserUpdateResponse
 * @description
 * Represents the response structure from Laravel's user update endpoint.
 * Returns status, message, and updated user data.
 *
 * @example
 * ```typescript
 * {
 *   status: "success",
 *   message: "User updated successfully",
 *   data: { id: 1, name: "John Doe", ... }
 * }
 * ```
 */
export interface UserUpdateResponse {
    /** Response status */
    status: string;
    /** Response message */
    message: string;
    /** Updated user data */
    data: UserData;
}

