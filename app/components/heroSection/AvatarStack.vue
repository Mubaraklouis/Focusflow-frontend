<template>
  <div class="flex items-center -space-x-2">
    <div 
      v-for="(avatar, index) in avatars" 
      :key="index"
      class="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-primary/10 flex items-center justify-center text-xs font-medium"
      :style="{ zIndex: avatars.length - index }"
    >
      {{ avatar }}
    </div>
    <div class="inline-flex h-8 px-3 items-center justify-center rounded-full ring-2 ring-background bg-muted text-xs font-medium" :style="{ zIndex: 0 }">
      +{{ totalUsers }}
    </div>
  </div>
</template>

<script setup>
const avatars = ['JD', 'AB', 'CD', 'EF'];
const totalUsers = 1000;
</script>
