<script setup lang="ts">
import InputError from '@/components/InputError.vue';
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthBase from '@/layouts/AuthLayout.vue';
import { LoaderCircle } from 'lucide-vue-next';
import { reactive, ref } from 'vue';
import useAuthApi from '~/composables/Auth/useAuthApi';

// Removed the invalid import for `data` from useAuthApi, as 'data' is not exported.

useHead({
    title: 'Register',
});

const { data,Form,submit } = await useAuthApi()

</script>

<template>
    <AuthBase
        title="Create an account"
        description="Enter your details below to create your account"
        variant="card"
    >
        <!-- Social Sign-up Buttons -->
        <div class="flex flex-col gap-3 mb-6">
            <a href="http://ec2-16-171-250-147.eu-north-1.compute.amazonaws.com/api/v1/auth/google/redirect" class="w-full">
                <Button 
                    class="w-full bg-gray-800 hover:bg-gray-700 text-white dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21.35 11.1h-9.17v2.72h5.27c-.23 1.3-.92 2.4-1.95 3.14v2.6h3.14c1.84-1.7 2.9-4.2 2.9-6.86 0-.46-.04-.92-.1-1.36z" fill="#4285F4"/>
                        <path d="M12.18 21.82c2.64 0 4.86-.88 6.48-2.4l-3.14-2.6c-.88.6-2 1-3.34 1-2.56 0-4.72-1.72-5.5-4.04H3.42v2.54c1.6 3.18 4.9 5.5 8.76 5.5z" fill="#34A853"/>
                        <path d="M6.68 13.78c-.2-.6-.3-1.24-.3-1.88s.1-1.28.3-1.88V7.48H3.42C2.72 8.92 2.36 10.44 2.36 12s.36 3.08 1.06 4.52l3.26-2.74z" fill="#FBBC05"/>
                        <path d="M12.18 5.5c1.44 0 2.74.5 3.76 1.48l2.8-2.8C16.98 2.8 14.76 2 12.18 2 8.32 2 5.02 4.32 3.42 7.5l3.26 2.54c.78-2.32 2.94-4.04 5.5-4.04z" fill="#EA4335"/>
                    </svg>
                    Sign up with Google
                </Button>
            </a>
        </div>

        <div class="relative my-8">
            <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-border"></div>
            </div>
            <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
        </div>

        <form @submit.prevent="submit" class="flex flex-col gap-6">
            <div class="grid gap-6">
                <div class="grid gap-2">
                    <Label class="text-sm font-medium text-foreground" for="name">Name</Label>
                    <Input
                        id="name"
                        type="text"
                        required
                        autofocus
                        :tabindex="1"
                        autocomplete="name"
                        v-model="Form.name"
                        placeholder="Full name"
                        class="w-full border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                    <InputError :message="Form.errors.name" />
                </div>

                <div class="grid gap-2">
                    <Label class="text-sm font-medium text-foreground" for="email">Email address</Label>
                    <Input
                        id="email"
                        type="email"
                        required
                        :tabindex="2"
                        autocomplete="email"
                        v-model="Form.email"
                        placeholder="email@example.com"
                        class="w-full border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                    <InputError :message="Form.errors.email" />
                </div>

                <div class="grid gap-2">
                    <Label class="text-sm font-medium text-foreground" for="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        required
                        :tabindex="3"
                        autocomplete="new-password"
                        v-model="Form.password"
                        placeholder="Password"
                        class="w-full border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                    <InputError :message="Form.errors.password" />
                </div>

                <div class="grid gap-2">
                    <Label class="text-sm font-medium text-foreground" for="password_confirmation">Confirm password</Label>
                    <Input
                    
                        id="password_confirmation"
                        type="password"
                        required
                        :tabindex="4"
                        autocomplete="new-password"
                        v-model="Form.password_confirmation"
                        placeholder="Confirm password"
                        class="w-full border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                    <InputError :message="Form.errors.password_confirmation" />
                </div>

                <Button
                    type="submit"
                    class="mt-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 transition-all shadow-sm hover:shadow-md"
                    tabindex="5"
                    :disabled="Form.processing"
                >
                    <LoaderCircle v-if="Form.processing" class="h-4 w-4 mr-2 animate-spin" />
                    {{ Form.processing ? 'Creating account...' : 'Create account' }}
                </Button>
            </div>

            <div class="text-center text-sm text-muted-foreground">
                Already have an account?
                <TextLink href="/login" :tabindex="6">Log in</TextLink>
            </div>
        </form>
    </AuthBase>
</template>
