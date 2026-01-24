
import { useAuth } from '~/composables/Auth/useAuth'

const Form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  processing: false,
  errors: {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    general: '',
  } as Record<string, string>,
});

const submit = async () => {
  Form.value.processing = true;
  Form.value.errors = { name: '', email: '', password: '', password_confirmation: '', general: '' };

  try {
    console.log('Submitting registration...')
    const response = await $fetch('/api/user/register', {
      method: 'POST',
      body: {
        name: Form.value.name,
        email: Form.value.email,
        password: Form.value.password,
        password_confirmation: Form.value.password_confirmation,
      },
    });

    // Set authenticated state before redirecting
    const { setAuthenticated } = useAuth()
    setAuthenticated(true)

    // Redirect to dashboard after successful registration
    await navigateTo('/dashboard', { external: true });
  } catch (error: any) {
    console.error('Registration failed in useAuthApi:', error)
    console.error('Error status:', error.statusCode)
    console.error('Error data:', error.data)

    if (error.data) {
      // Handle field-specific validation errors
      if (error.data.errors) {
        // Map Laravel validation errors to form fields
        const errors = error.data.errors;
        if (typeof errors === 'object') {
          // Laravel returns errors as { field: ['message1', 'message2'] }
          Object.keys(errors).forEach(key => {
            if (Array.isArray(errors[key])) {
              Form.value.errors[key] = errors[key][0]; // Take first error message
            } else {
              Form.value.errors[key] = errors[key];
            }
          });
        }
      }
      // Handle general error message from server
      if (error.data.message) {
        Form.value.errors.general = error.data.message;
      }
    } else if (error.statusCode === 422) {
      Form.value.errors.general = 'Please check your information and try again.';
    } else if (error.statusCode === 409) {
      Form.value.errors.email = 'This email address is already registered.';
      Form.value.errors.general = 'An account with this email already exists. Please login instead.';
    } else if (error.statusCode === 429) {
      Form.value.errors.general = 'Too many registration attempts. Please try again later.';
    } else if (error.message) {
      Form.value.errors.general = error.message;
    } else {
      Form.value.errors.general = 'An unexpected error occurred. Please try again.';
    }
    return;
  } finally {
    Form.value.processing = false;
    Form.value.password = '';
    Form.value.password_confirmation = '';
  }
};


const data = ref("useing the compable ")

const useAuthApi = async () => {

  return {
    Form,
    data,
    submit
  }

}

export default useAuthApi
