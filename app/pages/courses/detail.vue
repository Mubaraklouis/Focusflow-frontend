<script setup lang="ts">
import { useHead } from '#imports';
import CourseMaterialDetailView from '~/components/course-material/CourseMaterialDetailView.vue';

/**
 * @module pages/courses/detail
 * Route entry for the course material detail screen.
 */

definePageMeta({
  layout: false,
  middleware: ['auth'],
});

useHead({
  title: 'Course Detail - FocusFlow',
});

const breadcrumbs = [
  { title: 'Courses', href: '/courses' },
  { title: 'Course Detail', href: '/courses/detail', current: true },
];
</script>

<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <CourseMaterialDetailView />
  </NuxtLayout>
</template>
