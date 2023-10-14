<script setup lang="ts">
import { buttonVariants } from ".";
import { Loader2 } from "lucide-vue-next";
import { cn } from "@/utils/chadcn";

interface Props {
  variant?: NonNullable<Parameters<typeof buttonVariants>[0]>["variant"];
  size?: NonNullable<Parameters<typeof buttonVariants>[0]>["size"];
  as?: string;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  as: "button",
  loading: false,
});
</script>

<template>
  <component
    :is="as"
    :class="cn(buttonVariants({ variant, size }), $attrs.class ?? '')"
  >
    <Loader2 v-if="loading" class="animate-spin" :size="16" />
    <slot name="loading" v-if="loading && $slots.loading" />
    <slot v-else />
  </component>
</template>
