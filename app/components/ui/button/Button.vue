<script setup lang="ts">
interface Props {
  variant?: 'default' | 'outline' | 'ghost';
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  class: ''
});

const variantClasses = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground'
};
</script>

<template>
  <button 
    :class="[
      'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
      variantClasses[variant],
      props.class
    ]"
  >
    <slot />
  </button>
</template>
