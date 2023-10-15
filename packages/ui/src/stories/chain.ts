import { defineStore } from "pinia";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { AssetPriceRates, assetPricingService } from "../services/assetPricingService";
import { graphQLService } from "@/services/graphqlService";
import { AssetMetadata } from "@/types";

export type StateTokenMetadata = { [tokenId: string]: AssetMetadata };

export const useChainStore = defineStore("chain", () => {
  // private
  let _timer: number;

  // state
  const _loading = ref(true);
  const _height = ref<number>(0);
  const _priceRates = ref<AssetPriceRates>({});

  // computed
  // const tokensMetadata = computed(() => _metadata.value);
  // const priceRates = computed(() => _priceRates.value);
  // const loading = computed(() => _loading.value);
  // const height = computed(() => _height.value);

  // watchers
  watch(
    _height,
    (newVal, oldVal) => {
      if (newVal > 0 && !oldVal) {
        return;
      }

      loadPriceRates();
    },
    { immediate: true }
  );

  // hooks
  onMounted(async () => {
    _height.value = (await graphQLService.getCurrentHeight()) || 0;

    _timer = setInterval(async () => {
      const height = await graphQLService.getCurrentHeight();
      if (height && _height.value !== height) {
        _height.value = height;
      }
    }, 5000) as unknown as number;
  });

  onBeforeUnmount(() => {
    clearInterval(_timer);
  });

  async function loadPriceRates() {
    const tokens = await assetPricingService.getTokenRates();
    _priceRates.value = tokens;

    localStorage.setItem("prices", JSON.stringify(tokens));
  }

  return {
    priceRates: _priceRates,
    isLoading: _loading,
    height: _height
  };
});
