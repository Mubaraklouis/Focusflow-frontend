import { ref, onMounted } from 'vue';

/**
 * @module composables/useTheme
 */

/**
 * Vue composable that provides theme tracking functionality.
 * 
 * This composable tracks whether the application is in dark mode by observing
 * the 'dark' class on the document element. It sets up a MutationObserver
 * to detect changes to the class attribute.
 *
 * @returns {Object} An object containing reactive state for theme
 * @returns {Object} returns.isDark - Reactive reference indicating if dark theme is active
 *
 * @example
 * ```js
 * import { useTheme } from '@/composables/useTheme';
 * 
 * const { isDark } = useTheme();
 * // Use isDark.value to get the current theme state
 * console.log(isDark.value ? 'Dark mode' : 'Light mode');
 * ```
 */
export function useTheme() {
    /**
     * Reactive reference tracking dark mode state
     * @type {Object}
     */
    const isDark = ref(false);

    /**
     * Updates the isDark value based on document class
     * @private
     */
    const updateTheme = () => {
        isDark.value = document.documentElement.classList.contains('dark');
    };

    onMounted(() => {
        // Initialize theme on component mount
        updateTheme();
        
        // Set up observer to track theme changes
        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
    });

    return {
        isDark
    };
}
