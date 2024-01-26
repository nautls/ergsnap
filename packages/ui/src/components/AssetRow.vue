<script setup lang="ts">
import { BigNumber } from "bignumber.js";
import { CornerLeftUp, CornerRightDown } from "lucide-vue-next";
import { PropType } from "vue";
import AssetIcon from "./AssetIcon.vue";
import AssetPrice from "./AssetPrice.vue";
import ExplorerLink from "./ExplorerLink.vue";
import { ERG_TOKEN_ID } from "@/constants";
import { useChainStore } from "@/stories";
import { AssetInfo } from "@/types";
import { displayAmount, displayName } from "@/utils/assets";
import { cn } from "@/utils/chadcn";

const chain = useChainStore();

defineProps({
  asset: { type: Object as PropType<AssetInfo<Readonly<BigNumber>>>, default: undefined },
  rootClass: { type: String, default: "" },
  nameClass: { type: String, default: "" },
  amountClass: { type: String, default: "" },
  logoClass: { type: String, default: "" },
  maxNameLen: { type: Number, default: 20 },
  displayPrice: { type: Boolean, default: true },
  displaySignaling: { type: Boolean, default: false },
  link: Boolean
});
</script>

<template>
  <div :class="cn(['flex w-full items-center justify-start gap-2', rootClass])">
    <template v-if="asset">
      <template v-if="displaySignaling">
        <CornerLeftUp v-if="asset.amount.isNegative()" :size="16" class="text-red-500/70" />
        <CornerRightDown v-else :size="16" class="text-green-500/70" />
      </template>

      <AssetIcon :token-id="asset.tokenId" :custom-class="logoClass" />
      <div class="flex-grow">
        <ExplorerLink
          v-if="link && asset.tokenId !== ERG_TOKEN_ID"
          :class="cn(['break-all', nameClass])"
          :value="asset.tokenId"
          type="token"
        >
          {{ displayName(asset, chain, chain.metadata[asset.tokenId]?.name ? maxNameLen : 10) }}
        </ExplorerLink>
        <div v-else :class="cn(['break-all', nameClass])">
          {{ displayName(asset, chain, chain.metadata[asset.tokenId]?.name ? maxNameLen : 10) }}
        </div>
      </div>

      <div :class="cn(['text-right', amountClass])">
        <div>{{ displayAmount(asset, chain) }}</div>
        <AssetPrice v-if="displayPrice" :asset="asset" />
      </div>
    </template>
    <template v-else>
      <div :class="nameClass" class="skeleton-fixed h-4 w-8/12"></div>
      <div :class="amountClass" class="skeleton-fixed h-4 w-8/12"></div>
    </template>
  </div>
</template>
