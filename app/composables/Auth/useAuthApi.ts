
import { useAuth } from '~/composables/Auth/useAuth'

const Form = ref({
  // personal (free; Pro later) or institution (the new account owns it)
  account_type: 'personal' as 'personal' | 'institution',
  institution_name: '',
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
    institution_name: '',
    general: '',
  } as Record<string, string>,
});

const submit = async () => {
  Form.value.processing = true;
  Form.value.errors = { name: '', email: '', password: '', password_confirmation: '', institution_name: '', general: '' };
  const institution = Form.value.account_type === 'institution' ? Form.value.institution_name.trim() : ''
  if (Form.value.account_type === 'institution' && !institution) {
    Form.value.errors.institution_name = 'Give your institution a name.'
    Form.value.processing = false
    return
  }

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

    // An institution account: the new user creates it and becomes its owner
    if (institution) {
      try {
        const res = await $fetch<{ data: { id: number } }>('/api/learn/institutions', { method: 'POST', body: { name: institution } })
        await navigateTo(`/institutions/${res.data.id}`, { external: true })
        return
      } catch {
        await navigateTo('/institutions', { external: true }) // create it there
        return
      }
    }

    // Redirect to dashboard after successful registration
    await navigateTo(nextPath(), { external: true });
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
