<script setup lang="ts">
import { PropType, ref, watch } from "vue";
import { computed } from "vue";
import { Input } from "@/components/ui/input";
import { vCleave } from "@/directives/cleave";
import { CleaveOnChangedEvent, CleaveOptions, HTMLCleaveElement } from "@/types";

// emits
const emit = defineEmits(["update:modelValue"]);

// props
const props = defineProps({
  options: { type: Object as PropType<CleaveOptions>, default: undefined },
  modelValue: { type: String, required: true }
});

// refs
const input = ref<HTMLCleaveElement>();
let internalValue = "";

// computed
const value = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  }
});

// watchers
watch(value, (newVal) => {
  if (internalValue === newVal) {
    return;
  }

  input.value?.cleave.setRawValue(newVal);
});

// methods
function onChanged(event: CleaveOnChangedEvent) {
  let rawValue = event.target.rawValue;

  if (rawValue.endsWith(".")) {
    rawValue = rawValue.substring(0, rawValue.length - 1);
  } else if (rawValue.startsWith(".")) {
    rawValue = "0" + rawValue;
  }

  internalValue = rawValue;
  value.value = rawValue;
}

function focus() {
  input.value?.focus();
}

defineExpose({ focus });
</script>

<template>
  <Input
    ref="input"
    v-bind="$attrs"
    v-cleave="{
      ...options,
      initValue: props.modelValue,
      onValueChanged: onChanged
    }"
  />
</template>
