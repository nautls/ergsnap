<script setup lang="ts">
import BigNumber from "bignumber.js";
import { PropType, ref, watch } from "vue";
import { computed } from "vue";
import AssetIcon from "./AssetIcon.vue";
import { vCleave } from "@/directives/cleave";
import { AssetInfo, CleaveOnChangedEvent, CleaveOptions, HTMLCleaveElement } from "@/types";
import { decimalizeBigNumber, displayName, displayAmount } from "@/utils/assets";
import { cn } from "@/utils/chadcn";
import { useChainStore } from "../stories";

const chain = useChainStore();

// emits
const emit = defineEmits(["update:modelValue"]);

// props
const props = defineProps({
  options: { type: Object as PropType<CleaveOptions>, default: undefined },
  asset: { type: Object as PropType<AssetInfo<Readonly<BigNumber>>>, default: undefined },
  modelValue: { type: String, required: false, default: "" }
});

// refs
const inputEl = ref<HTMLCleaveElement>();
let internalValue = "";

// computed
const modelValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  }
});

// watchers
watch(modelValue, (newVal) => {
  if (internalValue === newVal) {
    return;
  }

  inputEl.value?.cleave.setRawValue(newVal);
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
  modelValue.value = rawValue;
}

function focus() {
  inputEl.value?.focus();
}

function setFullBalance() {
  modelValue.value = decimalizeBigNumber(
    props.asset?.amount ?? BigNumber(0),
    chain.metadata[props.asset?.tokenId ?? ""]?.decimals ?? 0
  ).toString();
}

defineExpose({ focus });
</script>

<template>
  <div class="relative">
    <input
      ref="inputEl"
      v-cleave="{
        ...options,
        numeral: true,
        numeralPositiveOnly: true,
        numeralDecimalScale: chain.metadata[props.asset?.tokenId ?? '']?.decimals ?? 0,
        initValue: props.modelValue,
        onValueChanged: onChanged
      }"
      :class="
        cn(
          'flex h-16 w-full rounded-md border border-input bg-background px-3 py-2 pb-6 pr-28 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          $attrs.class ?? ''
        )
      "
    />
    <div class="absolute right-3 top-3 flex flex-row items-center gap-1">
      <div>{{ displayName(asset, chain, 10) }}</div>
      <AssetIcon :token-id="props.asset?.tokenId ?? ''" custom-class="w-5" />
    </div>
    <div class="absolute bottom-2 right-3 text-xs text-muted-foreground">
      <a class="cursor-pointer" @click="setFullBalance()"
        >Balance: {{ displayAmount(asset, chain) }}</a
      >
    </div>
  </div>
</template>
