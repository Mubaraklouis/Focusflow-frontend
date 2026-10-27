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
import useGoogleAuth from '~/composables/Auth/useGoogleAuth';


useHead({
    title: 'Register',
});

const { data, Form, submit } = await useAuthApi()
const { initiateGoogleAuth } = useGoogleAuth()
const accountTypes = [
    { value: 'personal' as const, title: 'Just me', text: 'Free or Pro' },
    { value: 'institution' as const, title: 'An institution', text: 'School, university or company' },
]

</script>

<template>
    <AuthBase
        title="Create an account"
        description="Enter your details below to create your account"
        variant="card"
    >
        <!-- Social Sign-up Buttons -->
        <div class="flex flex-col gap-3 mb-6">
            <Button 
                @click="initiateGoogleAuth"
                type="button"
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
            <!-- General Error Alert -->
            <div v-if="Form.errors.general" class="p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200 text-sm border border-red-200 dark:border-red-800">
                <div class="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                    <span>{{ Form.errors.general }}</span>
                </div>
            </div>

            <div class="grid gap-6">
                <!-- Account type: just me (Free or Pro) or an institution -->
                <fieldset class="grid gap-2">
                    <legend class="mb-2 text-sm font-medium text-foreground">Account for</legend>
                    <div class="grid grid-cols-2 gap-2">
                        <button v-for="t in accountTypes" :key="t.value" type="button" :aria-pressed="Form.account_type === t.value"
                            class="rounded-xl border p-3 text-left transition-colors"
                            :class="Form.account_type === t.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-input hover:bg-muted/50'"
                            @click="Form.account_type = t.value">
                            <span class="block text-sm font-semibold text-foreground">{{ t.title }}</span>
                            <span class="mt-0.5 block text-xs text-muted-foreground">{{ t.text }}</span>
                        </button>
                    </div>
                    <p class="text-xs text-muted-foreground">{{ Form.account_type === 'personal'
                        ? 'You start on Free: create and publish courses, learn anything. Pro adds more courses and more AI.'
                        : 'You become the owner: add lecturers and students by email, like an organisation. Everyone keeps their own account.' }}</p>
                </fieldset>
                <div v-if="Form.account_type === 'institution'" class="grid gap-2">
                    <Label class="text-sm font-medium text-foreground" for="institution_name">Institution name</Label>
                    <Input id="institution_name" type="text" maxlength="255" v-model="Form.institution_name" placeholder="e.g. University of Rwanda, School of ICT"
                        class="w-full border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary" />
                    <InputError :message="Form.errors.institution_name" />
                </div>
                <div class="grid gap-2">
                    <Label class="text-sm font-medium text-foreground" for="name">{{ Form.account_type === 'institution' ? 'Your name' : 'Name' }}</Label>
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
