<script setup lang="ts">

import Button from '@/components/ui/button/Button.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';

const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
};
</script>

<template>
    <nav class="bg-background border-border py-2.5">
        <div class="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between px-4">
            <NuxtLink to="/" class="flex items-center">
                <span class="self-center whitespace-nowrap text-xl font-extrabold text-primary">FocusFlow</span>
            </NuxtLink>
            <div class="flex items-center lg:order-2">
                <div class="mr-4 mt-2 hidden sm:inline-block">
                    <span></span>
                </div>

                <!-- Desktop Buttons -->
                <div class="hidden lg:flex items-center gap-5">
                    <ThemeToggle />
                    <NuxtLink to="/register">
                        <Button variant="outline" class="button-hover">
                            Sign Up
                        </Button>
                    </NuxtLink>
                    <NuxtLink to="/register">
                        <Button>Get Started</Button>
                    </NuxtLink>
                </div>

                <button @click="toggleMobileMenu" type="button"
                    class="ml-1 inline-flex items-center rounded-lg p-2 text-sm text-muted-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring lg:hidden hover-effect"
                    aria-controls="mobile-menu-2" :aria-expanded="isMobileMenuOpen">
                    <span class="sr-only">Open main menu</span>
                    <svg v-if="!isMobileMenuOpen" class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd"
                            d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                            clip-rule="evenodd"></path>
                    </svg>
                    <svg v-else class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
            <div class="w-full items-center justify-between lg:order-1 lg:flex lg:w-auto"
                :class="{ hidden: !isMobileMenuOpen }" id="mobile-menu-2">
                <ul class="mt-4 flex flex-col font-medium lg:mt-0 lg:flex-row lg:space-x-8">
                    <li>
                        <a href="#features"
                            class="nav-link bg-primary text-primary-foreground block rounded py-2 pl-3 pr-4 lg:bg-transparent lg:p-0 lg:text-primary"
                            aria-current="page">Features</a>
                    </li>
                    <li>
                        <a href="#blog"
                            class="nav-link block border-b border-border py-2 pl-3 pr-4 text-foreground lg:border-0 lg:p-0">Blog</a>
                    </li>
                    <li>
                        <a href="#pricing"
                            class="nav-link block border-b border-border py-2 pl-3 pr-4 text-foreground lg:border-0 lg:p-0">Pricing</a>
                    </li>
                    <li>
                        <a href="#contact"
                            class="nav-link block border-b border-border py-2 pl-3 pr-4 text-foreground lg:border-0 lg:p-0">Contact</a>
                    </li>
                    <li>
                        <a href="#team"
                            class="nav-link block border-b border-border py-2 pl-3 pr-4 text-foreground lg:border-0 lg:p-0">Team</a>
                    </li>
                    <!-- Mobile Buttons -->
                    <li class="lg:hidden">
                        <div class="flex flex-col gap-3 px-3 py-2">
                            <ThemeToggle />
                            <NuxtLink to="/register">
                                <Button variant="outline" class="w-full button-hover">
                                    Sign Up
                                </Button>
                            </NuxtLink>
                            <NuxtLink to="/register">
                                <Button class="w-full button-hover">
                                    Get started
                                </Button>
                            </NuxtLink>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
</template>
