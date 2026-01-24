<script setup lang="ts">
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthBase from '@/layouts/AuthLayout.vue';
import { LoaderCircle } from 'lucide-vue-next';
import { useForgetPassword } from '~/composables/Auth/useForgetPassword';


const { form, submit, status } = await useForgetPassword()

useHead({
    title: 'Forgot Password',
});
</script>

<template>
    <AuthBase
        title="Forgot Password"
        description="Forgot your password? No problem. Just let us know your email address and we will email you a password reset link."
        variant="card"
    >
        <form @submit.prevent="submit" class="space-y-6">
            <div v-if="status" class="p-4 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200 text-sm">
                {{ status }}
            </div>

            <div class="space-y-4">
                <div class="space-y-2">
                    <Label class="text-sm font-medium text-foreground" for="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        required
                        autofocus
                        autocomplete="username"
                        v-model="form.email"
                        placeholder="you@example.com"
                        class="w-full border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                    <InputError :message="form.errors.email" />
                </div>
            </div>

            <div class="flex items-center justify-end mt-4">
                <Button
                    type="submit"
                    class="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 transition-all shadow-sm hover:shadow-md"
                    :disabled="form.processing"
                >
                    <LoaderCircle v-if="form.processing" class="h-4 w-4 mr-2 animate-spin" />
                    {{ form.processing ? 'Sending...' : 'Email Password Reset Link' }}
                </Button>
            </div>
        </form>
    </AuthBase>
</template>
