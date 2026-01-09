

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
    } as Record<string, string>,
});

const submit = async () => {
    form.processing = true;
    form.errors = { email: '', password: '' };

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
        
        // Redirect on success
        await navigateTo('/dashboard'); // or /
    } catch (error: any) {
        if (error.data && error.data.errors) {
            form.errors = error.data.errors;
        } else {
            console.error('Login failed', error);
        }
    } finally {
        form.processing = false;
        form.password = '';
    }
};


const useLogin = async () => {
    return{
        form,
        submit,
        status,
        canResetPassword: true
    }

    
}

export default useLogin