/**
 * @fileoverview Profile edit mode and form state management
 * @module composables/Profile/useProfileEdit
 * @description
 * Manages the edit mode state and form data for profile editing.
 * Handles the toggle between view and edit modes, form synchronization,
 * and save/cancel operations.
 *
 * This composable works in conjunction with useProfile to manage
 * the editing workflow without directly modifying the profile state
 * until changes are saved.
 *
 * @example
 * ```typescript
 * import { useProfileEdit } from '~/composables/Profile'
 *
 * const { isEditMode, editForm, toggleEditMode, saveChanges } = useProfileEdit()
 *
 * // Enter edit mode
 * toggleEditMode()
 *
 * // Modify form data
 * editForm.value.name = 'New Name'
 *
 * // Save changes
 * await saveChanges()
 * ```
 */

import { ref } from 'vue';
import { useProfile } from './useProfile';

/**
 * Editable profile form fields
 *
 * @interface EditFormData
 * @description
 * Contains only the fields that users are allowed to edit.
 * This is a subset of UserProfile to prevent editing of
 * system-managed fields like id, email, username, etc.
 */
export interface EditFormData {
    /** User's display name */
    name: string;
    /** User's bio or about text */
    bio: string;
    /** User's location */
    location: string;
    /** User's website URL */
    website: string;
}

/**
 * Default empty form state
 * @internal
 */
const DEFAULT_FORM: Readonly<EditFormData> = Object.freeze({
    name: '',
    bio: '',
    location: '',
    website: '',
});

/**
 * Profile edit mode composable
 *
 * @description
 * Provides edit mode state management and form handling for profile editing.
 * Maintains a separate form state that can be modified without affecting
 * the actual profile until explicitly saved.
 *
 * **State:**
 * - `isEditMode` - Whether edit mode is active
 * - `isSaving` - Whether a save operation is in progress
 * - `editForm` - The editable form data
 *
 * **Methods:**
 * - `toggleEditMode()` - Toggle between view and edit modes
 * - `enableEditMode()` - Enter edit mode
 * - `cancelEdit()` - Exit edit mode without saving
 * - `saveChanges()` - Save form data to profile
 * - `updateField()` - Update a single form field
 *
 * @returns Edit state and methods
 *
 * @example
 * ```typescript
 * const {
 *   isEditMode,
 *   editForm,
 *   toggleEditMode,
 *   saveChanges,
 *   cancelEdit
 * } = useProfileEdit()
 *
 * // Toggle edit mode
 * toggleEditMode()
 *
 * // Check if in edit mode
 * if (isEditMode.value) {
 *   editForm.value.bio = 'Updated bio'
 * }
 *
 * // Save or cancel
 * await saveChanges() // or cancelEdit()
 * ```
 */
export function useProfileEdit() {
    const { profile, setProfile } = useProfile();

    /**
     * Whether edit mode is currently active
     */
    const isEditMode = ref<boolean>(false);

    /**
     * Whether a save operation is in progress
     */
    const isSaving = ref<boolean>(false);

    /**
     * Form data for editing
     * @remarks Separate from profile to allow cancellation
     */
    const editForm = ref<EditFormData>({ ...DEFAULT_FORM });

    /**
     * Synchronizes form data with current profile state
     *
     * @description
     * Copies editable fields from the profile to the form.
     * Called when entering edit mode or cancelling edits.
     *
     * @internal
     */
    const syncFormWithProfile = (): void => {
        editForm.value = {
            name: profile.value.name,
            bio: profile.value.bio,
            location: profile.value.location,
            website: profile.value.website,
        };
    };

    /**
     * Toggles edit mode on or off
     *
     * @description
     * When entering edit mode, syncs form with current profile data.
     * When exiting, simply closes edit mode (changes are lost).
     *
     * @example
     * ```typescript
     * toggleEditMode() // Enter edit mode
     * toggleEditMode() // Exit edit mode
     * ```
     */
    const toggleEditMode = (): void => {
        if (!isEditMode.value) {
            syncFormWithProfile();
        }
        isEditMode.value = !isEditMode.value;
    };

    /**
     * Enters edit mode
     *
     * @description
     * Explicitly enables edit mode and syncs form data.
     * Use this instead of toggleEditMode when you always want to enter edit mode.
     *
     * @example
     * ```typescript
     * enableEditMode()
     * ```
     */
    const enableEditMode = (): void => {
        syncFormWithProfile();
        isEditMode.value = true;
    };

    /**
     * Cancels editing and exits edit mode
     *
     * @description
     * Resets form to match current profile data and exits edit mode.
     * Any unsaved changes are discarded.
     *
     * @example
     * ```typescript
     * cancelEdit() // Discard changes and exit
     * ```
     */
    const cancelEdit = (): void => {
        syncFormWithProfile();
        isEditMode.value = false;
    };

    /**
     * Saves form changes to profile
     *
     * @description
     * Persists the current form data to the profile state.
     * In the future, this will also make an API call to save to the server.
     *
     * @returns Promise resolving to true if save succeeded, false otherwise
     *
     * @example
     * ```typescript
     * const success = await saveChanges()
     * if (success) {
     *   console.log('Profile updated!')
     * }
     * ```
     *
     * @todo Add API integration for server-side persistence
     */
    const saveChanges = async (): Promise<boolean> => {
        isSaving.value = true;

        try {
            // TODO: Add API call here
            // await profileApi.updateProfile(editForm.value)

            setProfile(editForm.value);
            isEditMode.value = false;
            return true;
        } catch (err) {
            return false;
        } finally {
            isSaving.value = false;
        }
    };

    /**
     * Updates a single form field
     *
     * @description
     * Type-safe method to update a specific field in the edit form.
     * Useful for controlled input handling.
     *
     * @typeParam K - Key of EditFormData
     * @param field - The field name to update
     * @param value - The new value for the field
     *
     * @example
     * ```typescript
     * updateField('name', 'John Doe')
     * updateField('bio', 'Software developer')
     * ```
     */
    const updateField = <K extends keyof EditFormData>(
        field: K,
        value: EditFormData[K]
    ): void => {
        editForm.value[field] = value;
    };

    return {
        isEditMode,
        isSaving,
        editForm,
        toggleEditMode,
        enableEditMode,
        cancelEdit,
        saveChanges,
        updateField,
    };
}
