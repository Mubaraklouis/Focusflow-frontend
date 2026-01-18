
const status = ref('')

const form = reactive({
    email: '',
    processing: false,
    errors: {
        email: '',
    } as Record<string, string>,
})

const submit = async () => {
    form.processing = true
    form.errors = { email: '' }
    status.value = ''

    try {
        const response = await $fetch('/api/user/forgotPassword', {
            method: 'POST' as any,
            body: {
                email: form.email,
            },
        })
        // @ts-ignore
        status.value = response.status || 'We have emailed your password reset link.'
    } catch (error: any) {
        if (error.data && error.data.errors) {
            form.errors = error.data.errors
        } else {
            form.errors.email = error.data?.message || 'Failed to send reset link.'
        }
    } finally {
        form.processing = false
    }
}

export const useForgetPassword = async () => {
    return {
        form,
        submit,
        status
    }
}