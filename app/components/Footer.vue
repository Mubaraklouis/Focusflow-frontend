<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-border px-6 py-10 text-sm text-muted-foreground md:px-8">
    <div class="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div>
        <span class="font-semibold text-foreground">FocusFlow</span>
        <p class="mt-1">Turn your slides, PDFs and videos into a course people finish.</p>
      </div>
      <nav class="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
        <a href="/#how" class="hover:text-primary">How it works</a>
        <a href="/#classes" class="hover:text-primary">For classes</a>
        <NuxtLink to="/login" class="hover:text-primary">Sign in</NuxtLink>
        <a href="https://github.com/FoucFlow/focusflow-api" target="_blank" rel="noopener" class="hover:text-primary">GitHub</a>
      </nav>
    </div>
    <p class="mx-auto mt-8 max-w-5xl text-xs">
      © {{ currentYear }} FocusFlow · Open source under the GNU AGPL-3.0
    </p>
  </footer>
</template>
