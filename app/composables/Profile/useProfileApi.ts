/**
 * @fileoverview Profile API composable for fetching user profile from server
 * @module composables/Profile/useProfileApi
 * @description
 * Provides methods to fetch the authenticated user's profile from the
 * Laravel backend via the Nuxt server proxy.
 *
 * This composable handles the API communication and integrates with
 * the useProfile composable to update the local state.
 *
 * @example
 * ```typescript
 * import { useProfileApi } from '~/composables/Profile'
 *
 * const { fetchProfile, isLoading, error } = useProfileApi()
 *
 * // Fetch and populate profile state
 * await fetchProfile()
 * ```
 */

import { ref } from 'vue';
import { useProfile, type UserProfile } from './useProfile';

/**
 * User data from API response
 * @internal
 */
interface UserData {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    username?: string;
    bio?: string;
    avatar?: string;
    location?: string;
    website?: string;
}

/**
 * API response type from server (Laravel wraps data in status/data structure)
 * @internal
 */
interface ProfileApiResponse {
    status: string;
    data: UserData;
}

/**
 * API response type for profile update
 * @internal
 */
interface ProfileUpdateResponse {
    status: string;
    message: string;
    data: UserData;
}

/**
 * Payload for updating user profile
 * @internal
 */
interface ProfileUpdatePayload {
    name?: string;
    username?: string;
    bio?: string;
    avatar?: string;
    location?: string;
    website?: string;
}

/**
 * Transforms API response to UserProfile format
 *
 * @param userData - User data from API response
 * @returns Transformed UserProfile object
 * @internal
 */
const transformApiResponse = (userData: UserData): Partial<UserProfile> => {
    const email = userData.email || '';
    const username = userData.username || (email ? email.split('@')[0] : '');
    
    // Handle avatar URL - prepend backend URL if it's a relative path
    let avatarUrl = userData.avatar || '';
    if (avatarUrl && !avatarUrl.startsWith('http')) {
        // TODO: Change to production URL after deployment
        const backendUrl = 'http://ec2-16-171-250-147.eu-north-1.compute.amazonaws.com';
        avatarUrl = `${backendUrl}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
    }
    
    return {
        id: String(userData.id || ''),
        name: userData.name || '',
        email: email,
        username: username,
        bio: userData.bio || '',
        avatar: avatarUrl,
        location: userData.location || '',
        website: userData.website || '',
        joinedDate: userData.created_at ? userData.created_at.split('T')[0] : '',
    };
};

/**
 * Profile API composable
 *
 * @description
 * Provides methods to fetch the authenticated user's profile from the backend.
 * Integrates with useProfile to update the local state automatically.
 *
 * **Methods:**
 * - `fetchProfile()` - Fetch profile from API and update state
 *
 * **State:**
 * - `isLoading` - Loading state for API calls
 * - `error` - Error message from failed requests
 *
 * @returns API methods and state
 *
 * @example
 * ```typescript
 * const { fetchProfile, isLoading, error } = useProfileApi()
 *
 * // In onMounted or setup
 * await fetchProfile()
 *
 * // Check for errors
 * if (error.value) {
 *   console.error('Failed to fetch profile:', error.value)
 * }
 * ```
 */
export function useProfileApi() {
    const { setProfile, setLoading, setError, profile } = useProfile();

    /**
     * Local loading state for API operations
     */
    const isLoading = ref<boolean>(false);

    /**
     * Local error state for API operations
     */
    const error = ref<string | null>(null);

    /**
     * Fetches the authenticated user's profile from the server
     *
     * @description
     * Makes a GET request to `/api/user/profile` and updates the
     * profile state with the response data. Handles loading and
     * error states automatically.
     *
     * @returns Promise resolving to true if successful, false otherwise
     *
     * @example
     * ```typescript
     * const success = await fetchProfile()
     * if (success) {
     *   console.log('Profile loaded:', profile.value.name)
     * }
     * ```
     */
    const fetchProfile = async (): Promise<boolean> => {
        isLoading.value = true;
        error.value = null;
        setLoading(true);
        setError(null);

        try {
            const response = await $fetch<ProfileApiResponse>('/api/user/profile', {
                method: 'GET',
                credentials: 'include',
            });

            // Validate response
            if (!response || typeof response !== 'object') {
                throw new Error('Invalid response from server');
            }

            // Extract user data from Laravel's response structure
            const userData = response.data;
            if (!userData || typeof userData !== 'object') {
                throw new Error('Invalid user data in response');
            }

            // Transform and set profile data
            const profileData = transformApiResponse(userData);
            setProfile(profileData);

            return true;

        } catch (err: any) {
            const errorMessage = err.data?.message || err.message || 'Failed to fetch profile';
            error.value = errorMessage;
            setError(errorMessage);

            return false;
        } finally {
            isLoading.value = false;
            setLoading(false);
        }
    };

    /**
     * Refreshes the profile data from the server
     *
     * @description
     * Alias for fetchProfile. Use when you want to explicitly
     * refresh/reload the profile data.
     *
     * @returns Promise resolving to true if successful
     */
    const refreshProfile = fetchProfile;

    /**
     * Updates the authenticated user's profile on the server (without avatar)
     *
     * @description
     * Makes a PUT request to `/api/user/profile` with JSON data.
     * For avatar uploads, use uploadAvatar separately.
     *
     * @param data - Profile data to update (name, bio, location, website)
     * @returns Promise resolving to true if successful, false otherwise
     */
    const updateProfile = async (data: ProfileUpdatePayload): Promise<boolean> => {
        isLoading.value = true;
        error.value = null;
        setLoading(true);
        setError(null);

        try {
            const response = await $fetch<ProfileUpdateResponse>('/api/user/profile', {
                method: 'PUT',
                credentials: 'include',
                body: data,
            });

            // Validate response
            if (!response || typeof response !== 'object') {
                throw new Error('Invalid response from server');
            }

            // Check for success status
            if (response.status !== 'success') {
                throw new Error(response.message || 'Failed to update profile');
            }

            // Extract user data from Laravel's response structure
            const userData = response.data;
            if (!userData || typeof userData !== 'object') {
                throw new Error('Invalid user data in response');
            }

            // Transform and set profile data
            const profileData = transformApiResponse(userData);
            setProfile(profileData);

            return true;

        } catch (err: any) {
            const errorMessage = err.data?.message || err.message || 'Failed to update profile';
            error.value = errorMessage;
            setError(errorMessage);

            return false;
        } finally {
            isLoading.value = false;
            setLoading(false);
        }
    };

    /**
     * Uploads avatar image for the authenticated user
     *
     * @description
     * Makes a POST request to `/api/user/profile` with multipart/form-data.
     * Only handles avatar upload, for other profile updates use updateProfile.
     *
     * @param avatarFile - The image file to upload as avatar
     * @returns Promise resolving to true if successful, false otherwise
     */
    const uploadAvatar = async (avatarFile: File): Promise<boolean> => {
        isLoading.value = true;
        error.value = null;
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('avatar', avatarFile);

            const response = await $fetch<ProfileUpdateResponse>('/api/user/profile', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            // Validate response
            if (!response || typeof response !== 'object') {
                throw new Error('Invalid response from server');
            }

            // Check for success status
            if (response.status !== 'success') {
                throw new Error(response.message || 'Failed to upload avatar');
            }

            // Extract user data from Laravel's response structure
            const userData = response.data;
            if (!userData || typeof userData !== 'object') {
                throw new Error('Invalid user data in response');
            }

            // Transform and set profile data
            const profileData = transformApiResponse(userData);
            setProfile(profileData);

            return true;

        } catch (err: any) {
            const errorMessage = err.data?.message || err.message || 'Failed to upload avatar';
            error.value = errorMessage;
            setError(errorMessage);

            return false;
        } finally {
            isLoading.value = false;
            setLoading(false);
        }
    };

    return {
        fetchProfile,
        refreshProfile,
        updateProfile,
        uploadAvatar,
        isLoading,
        error,
        profile,
    };
}
