<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


defineProps<{
    title?: string;
    description?: string;
}>();
</script>

<template>
    <div class="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
        <div class="flex w-full max-w-md flex-col gap-6">
            <NuxtLink to="/" class="group flex items-center gap-2 self-center font-medium transition-all duration-300 hover:scale-105">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 p-2 transition-all duration-300 group-hover:bg-primary/20">
                    <span class="text-primary font-bold text-base">Focus</span>
                </div>
                <span class="text-primary font-bold text-xl">Flow</span>
            </NuxtLink>

            <div class="flex flex-col gap-6">
                <Card class="rounded-xl border border-border shadow-md transition-all duration-300 hover:shadow-xl">
                    <CardHeader class="px-10 pb-0 pt-8 text-center">
                        <CardTitle class="text-2xl font-semibold tracking-tight text-foreground">{{ title }}</CardTitle>
                        <CardDescription class="mt-2 text-base text-muted-foreground">
                            {{ description }}
                        </CardDescription>
                    </CardHeader>
                    <CardContent class="px-10 py-8">
                        <slot />
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
</template>
