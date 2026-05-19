<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'radix-vue';

/**
 * @module components/ui/dialog
 * Accessible dialog/modal primitive built on radix-vue.
 */

const props = withDefaults(
  defineProps<{
    open?: boolean;
  }>(),
  { open: undefined },
);

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();
</script>

<template>
  <DialogRoot :open="props.open" @update:open="emit('update:open', $event)">
    <slot />
  </DialogRoot>
</template>
