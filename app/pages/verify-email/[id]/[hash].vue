<script setup lang="ts">
import { Button } from '@/components/ui/button';
import AuthBase from '@/layouts/AuthLayout.vue';
import { LoaderCircle, CheckCircle, XCircle } from 'lucide-vue-next';

const route = useRoute()

const status = ref<'verifying' | 'success' | 'error'>('verifying')
const errorMessage = ref('')

// Get route params and query
const id = route.params.id as string
const hash = route.params.hash as string
const expires = route.query.expires as string | undefined
const signature = route.query.signature as string | undefined

useHead({
    title: 'Verify Email - FocusFlow',
})

const verifyEmail = async () => {
    try {
        const response = await $fetch<{ status: string; message: string }>('/api/user/verifyEmail', {
            method: 'POST',
            body: {
                id,
                hash,
                expires,
                signature
            }
        })
        
        if (response.status === 'success' || response.status === 'already-verified') {
            status.value = 'success'
        }
    } catch (error: any) {
        status.value = 'error'
        errorMessage.value = error.data?.message || 'Email verification failed. The link may be invalid or expired.'
    }
}

const goToDashboard = () => {
    navigateTo('/dashboard?verified=1', { external: true })
}

const goToVerifyEmail = () => {
    navigateTo('/verify-email')
}

const goToLogin = () => {
    navigateTo('/login')
}

onMounted(() => {
    verifyEmail()
})
</script>

<template>
    <AuthBase
        title="Email Verification"
        description="Verifying your email address"
        variant="card"
    >
        <div class="flex flex-col items-center justify-center py-8 space-y-6">
            <!-- Verifying State -->
            <template v-if="status === 'verifying'">
                <LoaderCircle class="h-16 w-16 animate-spin text-primary" />
                <p class="text-center text-muted-foreground">
                    Verifying your email address...
                </p>
            </template>

            <!-- Success State -->
            <template v-else-if="status === 'success'">
                <CheckCircle class="h-16 w-16 text-green-500" />
                <div class="text-center space-y-2">
                    <h3 class="text-lg font-semibold text-foreground">Email Verified!</h3>
                    <p class="text-muted-foreground">
                        Your email address has been successfully verified.
                    </p>
                </div>
                <Button
                    @click="goToDashboard"
                    class="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    Continue to Dashboard
                </Button>
            </template>

            <!-- Error State -->
            <template v-else-if="status === 'error'">
                <XCircle class="h-16 w-16 text-red-500" />
                <div class="text-center space-y-2">
                    <h3 class="text-lg font-semibold text-foreground">Verification Failed</h3>
                    <p class="text-muted-foreground">
                        {{ errorMessage }}
                    </p>
                </div>
                <div class="flex flex-col gap-3 w-full">
                    <Button
                        @click="goToVerifyEmail"
                        class="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        Request New Verification Link
                    </Button>
                    <Button
                        @click="goToLogin"
                        variant="outline"
                        class="w-full"
                    >
                        Go to Login
                    </Button>
                </div>
            </template>
        </div>
    </AuthBase>
</template>
