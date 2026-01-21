/**
 * @fileoverview Profile composables barrel export
 * @module composables/Profile
 * @description
 * Central export point for all profile-related composables.
 * Import from this module to access profile functionality.
 *
 * ## Available Composables
 *
 * | Composable | Description |
 * |------------|-------------|
 * | `useProfile` | Core profile state management |
 * | `useProfileEdit` | Edit mode and form handling |
 * | `useProfileApi` | API calls to fetch/update profile |
 * | `useProfileUtils` | Utility functions (formatting, validation) |
 *
 * ## Available Types
 *
 * | Type | Description |
 * |------|-------------|
 * | `UserProfile` | Complete user profile interface |
 * | `Achievement` | User achievement interface |
 * | `EditFormData` | Editable profile fields interface |
 * | `DateFormatOptions` | Date formatting options |
 *
 * @example
 * ```typescript
 * // Import composables
 * import {
 *   useProfile,
 *   useProfileEdit,
 *   useProfileApi,
 *   useProfileUtils
 * } from '~/composables/Profile'
 *
 * // Import types
 * import type { UserProfile, Achievement } from '~/composables/Profile'
 * ```
 */

// Core profile state management
export { useProfile } from './useProfile';
export type { UserProfile, Achievement } from './useProfile';

// Edit mode and form handling
export { useProfileEdit } from './useProfileEdit';
export type { EditFormData } from './useProfileEdit';

// API calls for profile data
export { useProfileApi } from './useProfileApi';

// Utility functions
export { useProfileUtils } from './useProfileUtils';
export type { DateFormatOptions } from './useProfileUtils';
