<script setup lang="ts">
import { BigNumber } from "bignumber.js";
import { PropType } from "vue";
import AssetIcon from "./AssetIcon.vue";
import AssetPrice from "./AssetPrice.vue";
import { ERG_TOKEN_ID } from "@/constants";
import { AssetInfo } from "@/types";
import { displayAmount, displayName } from "@/utils/assets";
import { tokenUrlFor } from "@/utils/explorer";

defineProps({
  asset: { type: Object as PropType<AssetInfo<Readonly<BigNumber>>>, default: undefined },
  rootClass: { type: String, default: "" },
  nameClass: { type: String, default: "" },
  amountClass: { type: String, default: "" },
  maxNameLen: { type: Number, default: 20 },
  link: Boolean
});
</script>

<template>
  <div :class="rootClass" class="flex w-full justify-between gap-2">
    <template v-if="asset">
      <div :class="nameClass" class="flex items-center justify-start gap-2">
        <AssetIcon :token-id="asset.tokenId" custom-class="w-10" />
        <a
          v-if="link && asset.tokenId !== ERG_TOKEN_ID"
          class="break-all"
          :href="tokenUrlFor(asset.tokenId)"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ displayName(asset, asset.metadata?.name ? maxNameLen : 10) }}
        </a>
        <div v-else :class="nameClass" class="break-all">
          {{ displayName(asset, asset.metadata?.name ? maxNameLen : 10) }}
        </div>
      </div>

      <div class="flex flex-col items-end" :class="amountClass">
        <span class="font-bold">{{ displayAmount(asset) }}</span>
        <AssetPrice :asset="asset" />
      </div>
    </template>
    <template v-else>
      <div :class="nameClass" class="skeleton-fixed h-4 w-8/12"></div>
      <div :class="amountClass" class="skeleton-fixed h-4 w-8/12"></div>
    </template>
  </div>
</template>
