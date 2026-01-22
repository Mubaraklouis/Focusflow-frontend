<script setup lang="ts">
import { Button } from '@/components/ui/button';
import AuthBase from '@/layouts/AuthLayout.vue';
import { LoaderCircle, Mail, CheckCircle } from 'lucide-vue-next';

definePageMeta({
    middleware: 'auth'
})

useHead({
    title: 'Verify Email - FocusFlow',
})

const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const cooldown = ref(0)
const isVerified = ref(false)

let cooldownInterval: ReturnType<typeof setInterval> | null = null

// Check if user is already verified by fetching user data
const checkVerificationStatus = async () => {
    try {
        const response = await $fetch<{ data: { email_verified_at: string | null } }>('/api/user')
        if (response?.data?.email_verified_at) {
            isVerified.value = true
        }
    } catch (error) {
        // User might not be authenticated, ignore
    }
}

const resendEmail = async () => {
    if (loading.value || cooldown.value > 0) return

    loading.value = true
    message.value = ''

    try {
        const response = await $fetch<{ status: string }>('/api/user/resendVerification', {
            method: 'POST',
        })
        
        if (response.status === 'already-verified') {
            isVerified.value = true
            message.value = 'Your email is already verified!'
            messageType.value = 'success'
        } else {
            message.value = 'Verification email sent! Please check your inbox.'
            messageType.value = 'success'
            
            // Start cooldown (60 seconds)
            cooldown.value = 60
            cooldownInterval = setInterval(() => {
                cooldown.value--
                if (cooldown.value <= 0 && cooldownInterval) {
                    clearInterval(cooldownInterval)
                }
            }, 1000)
        }
    } catch (error: any) {
        if (error.statusCode === 429) {
            message.value = 'Too many requests. Please wait before trying again.'
        } else {
            message.value = error.data?.message || 'Failed to send verification email. Please try again.'
        }
        messageType.value = 'error'
    } finally {
        loading.value = false
    }
}

const goToDashboard = () => {
    navigateTo('/dashboard', { external: true })
}

// Poll for verification status
const pollVerificationStatus = () => {
    const interval = setInterval(async () => {
        try {
            const response = await $fetch<{ data: { email_verified_at: string | null } }>('/api/user')
            if (response?.data?.email_verified_at) {
                isVerified.value = true
                clearInterval(interval)
            }
        } catch (error) {
            // Handle error silently
        }
    }, 5000) // Check every 5 seconds

    // Clean up on unmount
    onUnmounted(() => clearInterval(interval))
}

onMounted(() => {
    checkVerificationStatus()
    pollVerificationStatus()
})

onUnmounted(() => {
    if (cooldownInterval) {
        clearInterval(cooldownInterval)
    }
})
</script>

<template>
    <AuthBase
        title="Verify Your Email"
        description="Please verify your email address to continue"
        variant="card"
    >
        <div class="flex flex-col items-center justify-center py-8 space-y-6">
            <!-- Already Verified State -->
            <template v-if="isVerified">
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

            <!-- Pending Verification State -->
            <template v-else>
                <Mail class="h-16 w-16 text-primary" />
                
                <div class="text-center space-y-2">
                    <p class="text-muted-foreground">
                        Thanks for signing up! Before getting started, please verify your email address by clicking on the link we just sent to you.
                    </p>
                    <p class="text-muted-foreground text-sm">
                        If you didn't receive the email, we will gladly send you another.
                    </p>
                </div>

                <!-- Status Message -->
                <div 
                    v-if="message" 
                    :class="[
                        'p-4 rounded-lg text-sm w-full text-center',
                        messageType === 'success' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200'
                    ]"
                >
                    {{ message }}
                </div>

                <Button
                    @click="resendEmail"
                    class="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    :disabled="loading || cooldown > 0"
                >
                    <LoaderCircle v-if="loading" class="h-4 w-4 mr-2 animate-spin" />
                    <span v-if="loading">Sending...</span>
                    <span v-else-if="cooldown > 0">Resend in {{ cooldown }}s</span>
                    <span v-else>Resend Verification Email</span>
                </Button>
            </template>
        </div>
    </AuthBase>
</template>
