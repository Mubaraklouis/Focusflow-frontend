
import { ref, reactive } from 'vue'

const status = ref('')

const form = reactive({
    token: '',
    email: '',
    password: '',
    password_confirmation: '',
    processing: false,
    errors: {
        email: '',
        password: '',
        password_confirmation: '',
    } as Record<string, string>,
})

const submit = async () => {
    form.processing = true
    form.errors = { email: '', password: '', password_confirmation: '' }
    status.value = ''

    try {
        const response = await $fetch('/api/user/resetPassword', {
            method: 'POST',
            body: {
                token: form.token,
                email: form.email,
                password: form.password,
                password_confirmation: form.password_confirmation,
            },
        })
        status.value = response.status || 'Your password has been reset.'

        // Optional: Redirect to login after success
        // setTimeout(() => navigateTo('/login'), 2000) 
        await navigateTo('/login')

    } catch (error: any) {
        if (error.data && error.data.errors) {
            form.errors = error.data.errors
        } else {
            // General error or specific field error logic
            console.error(error)
            form.errors.email = error.data?.message || 'Failed to reset password.'
        }
    } finally {
        form.processing = false
    }
}

export const useResetPassword = () => {
    return {
        form,
        submit,
        status
    }
}
