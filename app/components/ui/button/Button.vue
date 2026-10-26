<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  /** lg: bigger text and tap target (course building pages) */
  size?: 'default' | 'lg'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  class: ''
})

const variantClasses = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground'
}
const sizeClasses = {
  default: 'px-4 py-2 text-sm',
  lg: 'h-11 shrink-0 whitespace-nowrap px-5 text-base'
}
</script>

<template>
  <button 
    :class="cn(
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
      sizeClasses[size],
      variantClasses[variant],
      props.class
    )"
  >
    <slot />
  </button>
</template>

