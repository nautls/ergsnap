<script setup lang="ts">
import { computed, PropType } from "vue";
import { addressUrlFor, tokenUrlFor, transactionUrlFor } from "@/utils/explorer";

const props = defineProps({
  type: { type: String as PropType<"token" | "address" | "transaction">, required: true },
  value: { type: String, required: true },
  outside: { type: Boolean, default: false }
});

const href = computed(() => {
  if (props.type === "token") {
    return tokenUrlFor(props.value);
  } else if (props.type === "address") {
    return addressUrlFor(props.value);
  } else if (props.type === "transaction") {
    return transactionUrlFor(props.value);
  }

  return "#";
});
</script>

<template>
  <a :href="href" target="_blank" v-bind="$attrs">
    <slot />
  </a>
</template>
