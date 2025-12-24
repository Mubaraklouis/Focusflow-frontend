import { useAuth } from './useAuth'

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
  } as Record<string, string>,
});

const submit = async () => {
  Form.value.processing = true;
  Form.value.errors = { name: '', email: '', password: '', password_confirmation: '' };

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

    console.log('Registration API call succeeded:', response)

    console.log('User registered successfully')

    // Redirect to dashboard
    await navigateTo('/dashboard');
  } catch (error: any) {
    console.error('Registration failed in useAuthApi:', error)
    console.error('Error status:', error.statusCode)
    console.error('Error data:', error.data)

    if (error.data && error.data.errors) {
      console.error('Setting form validation errors:', error.data.errors)
      Form.value.errors = error.data.errors;
    } else {
      console.error('Non-validation error:', error);
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
