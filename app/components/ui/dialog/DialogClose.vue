<script setup lang="ts">
import { DialogClose } from 'radix-vue';
import { X } from 'lucide-vue-next';
</script>

<template>
  <DialogClose
    class="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
  >
    <X class="h-4 w-4" />
    <span class="sr-only">Close</span>
  </DialogClose>
</template>
