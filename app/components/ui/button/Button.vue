<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'tinted' | 'gray'
  /** lg: Apple-style pill (course building pages) */
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
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  // soft brand colour: secondary actions that still move the work forward
  tinted: 'bg-primary/10 text-primary hover:bg-primary/15',
  // quiet grey fill: Back, Skip, Cancel
  gray: 'bg-foreground/[0.06] text-foreground hover:bg-foreground/10'
}
const sizeClasses = {
  default: 'px-4 py-2 text-sm',
  lg: 'h-10 shrink-0 whitespace-nowrap rounded-full px-5 text-[15px] active:scale-[0.98] transition-[transform,background-color]'
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

