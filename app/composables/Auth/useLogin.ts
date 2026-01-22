
import { useAuth } from '~/composables/Auth/useAuth'

const status = ref('')
const canResetPassword = ref(true)


const form = reactive({
    email: '',
    password: '',
    remember: false,
    processing: false,
    errors: {
        email: '',
        password: '',
        general: '',
    } as Record<string, string>,
});

const submit = async () => {
    form.processing = true;
    form.errors = { email: '', password: '', general: '' };

    console.log("trying to login")

    try {
        await $fetch('/api/user/login', {
            method: 'POST',
            body: {
                email: form.email,
                password: form.password,
                remember: form.remember,
            },
        });

        // Set authenticated state before redirecting
        const { setAuthenticated } = useAuth()
        setAuthenticated(true)

        // Use external: true to force a full browser redirect
        // This ensures the newly set cookies are included in the HTTP request
        await navigateTo('/dashboard', { external: true });
    } catch (error: any) {
        console.error('Login failed:', error);
        
        if (error.data) {
            // Handle field-specific validation errors
            if (error.data.errors) {
                form.errors = { ...form.errors, ...error.data.errors };
            }
            // Handle general error message from server
            if (error.data.message) {
                form.errors.general = error.data.message;
            }
        } else if (error.statusCode === 401) {
            form.errors.general = 'Invalid email or password. Please try again.';
        } else if (error.statusCode === 422) {
            form.errors.general = 'Please check your credentials and try again.';
        } else if (error.statusCode === 429) {
            form.errors.general = 'Too many login attempts. Please try again later.';
        } else if (error.message) {
            form.errors.general = error.message;
        } else {
            form.errors.general = 'An unexpected error occurred. Please try again.';
        }
    } finally {
        form.processing = false;
        form.password = '';
    }
};


const useLogin = async () => {
    return {
        form,
        submit,
        status,
        canResetPassword: true
    }


}

export default useLogin