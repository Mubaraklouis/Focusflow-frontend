import { ref, watch } from 'vue';

/**
 * @module composables/useTheme
 */

// Global state to sync across all components
const isDark = ref(false);
const isInitialized = ref(false);

/**
 * Vue composable that provides theme management functionality.
 * Persists theme to localStorage and syncs across all components.
 *
 * @returns {Object} An object containing reactive state and methods for theme
 *
 * @example
 * ```js
 * import { useTheme } from '@/composables/useTheme';
 * 
 * const { isDark, toggleTheme } = useTheme();
 * // Toggle the theme
 * toggleTheme();
 * ```
 */
export function useTheme() {
    /**
     * Initialize theme from localStorage or system preference
     */
    const initTheme = () => {
        if (isInitialized.value) return;

        if (typeof window !== 'undefined') {
            // Check localStorage first
            const savedTheme = localStorage.getItem('focusflow-theme');

            if (savedTheme) {
                isDark.value = savedTheme === 'dark';
            } else {
                // Check system preference
                isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }

            applyTheme();
            isInitialized.value = true;
        }
    };

    /**
     * Apply the current theme to the document
     */
    const applyTheme = () => {
        if (typeof document !== 'undefined') {
            if (isDark.value) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    };

    /**
     * Toggle between light and dark themes
     */
    const toggleTheme = () => {
        isDark.value = !isDark.value;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('focusflow-theme', isDark.value ? 'dark' : 'light');
        }
        applyTheme();
    };

    /**
     * Set a specific theme
     */
    const setTheme = (dark: boolean) => {
        isDark.value = dark;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('focusflow-theme', dark ? 'dark' : 'light');
        }
        applyTheme();
    };

    // Auto-init on first use
    if (typeof window !== 'undefined' && !isInitialized.value) {
        initTheme();
    }

    return {
        isDark,
        toggleTheme,
        setTheme,
        initTheme
    };
}
