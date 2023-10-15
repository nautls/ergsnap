<script setup lang="ts">
import BigNumber from "bignumber.js";
import { computed, PropType } from "vue";
import { useChainStore } from "@/stories";
import { AssetInfo } from "@/types";
import { decimalizeBigNumber, formatBigNumber } from "@/utils/assets";

const chain = useChainStore();

const props = defineProps({
  asset: { type: Object as PropType<AssetInfo<Readonly<BigNumber>>>, default: undefined },
  customClass: { type: String, default: "" }
});

const price = computed(() => {
  if (!props.asset || !chain.priceRates[props.asset.tokenId]?.fiat) {
    return undefined;
  }

  return decimalizeBigNumber(props.asset.amount, props.asset.metadata?.decimals ?? 0).multipliedBy(
    chain.priceRates[props.asset.tokenId]?.fiat || 0
  );
});
</script>

<template>
  <div
    class="text-base-content skeleton min-w-min whitespace-nowrap text-xs opacity-70"
    :class="customClass"
  >
    <span>≈ {{ formatBigNumber(price, 2) }} USD</span>
  </div>
</template>
