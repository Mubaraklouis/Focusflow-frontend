

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
    await $fetch('/api/user/register', { // Adjust endpoint as needed
      method: 'POST',
      body: {
        name: Form.value.name,
        email: Form.value.email,
        password: Form.value.password,
        password_confirmation: Form.value.password_confirmation,
      },
    });

    // Redirect on success
    await navigateTo('/dashboard'); // or /
  } catch (error: any) {
    if (error.data && error.data.errors) {
      Form.value.errors = error.data.errors;
    } else {
      console.error('Registration failed', error);
    }
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

