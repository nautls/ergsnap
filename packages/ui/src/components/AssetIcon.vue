<script setup lang="ts">
import { isDefined } from "@fleet-sdk/common";
import { computed } from "vue";
import EmptyIcon from "@/assets/asset-empty.svg";
import { ASSET_ICONS } from "@/utils/assets";

// props
const props = defineProps({
  tokenId: { type: String, required: true },
  customClass: { type: String, default: "" }
});

// computed
const logo = computed(() => {
  const logoFile = ASSET_ICONS[props.tokenId];
  if (logoFile) {
    return `./asset-icons/${logoFile}`;
  }

  return undefined;
});

const hasLogo = computed(() => isDefined(logo.value));
const color = computed(() => calculateColor(props.tokenId));

function calculateColor(tokenId: string) {
  if (tokenId.length < 6) {
    return;
  }

  return `#${tokenId.substring(0, 6)}`;
}
</script>

<template>
  <div class="min-w-max">
    <img v-if="hasLogo" :class="customClass" :src="logo" />
    <empty-icon
      v-else
      :class="customClass"
      class="fill-gray-400 opacity-80"
      :style="`fill: ${color}`"
    />
  </div>
</template>
