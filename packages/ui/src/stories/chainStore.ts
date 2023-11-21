import { useStorage } from "@vueuse/core";
import { acceptHMRUpdate, defineStore } from "pinia";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { assetPricingService } from "../services/assetPricingService";
import { useWalletStore } from ".";
import { graphQLService } from "@/services/graphqlService";
import { AssetMetadata } from "@/types";

export type StateTokenMetadata = { [tokenId: string]: AssetMetadata };

export const useChainStore = defineStore("chain", () => {
  const wallet = useWalletStore();

  // private
  let _timer: number;

  // state
  const _loading = ref(true);
  const _height = ref(0);
  const _priceRates = useStorage("price-cache", {});

  // watchers
  watch(_height, (_, oldVal) => {
    if (!oldVal) return;

    loadPrices();
  });

  // hooks
  onMounted(async () => {
    _timer = setInterval(loadState, 5000) as unknown as number;

    await Promise.all([loadState(), loadPrices()]);
    _loading.value = false;
  });

  onBeforeUnmount(() => {
    clearInterval(_timer);
  });

  async function loadPrices() {
    _priceRates.value = await assetPricingService.getTokenRates();
  }

  async function loadState() {
    let height = 0;

    if (wallet.address) {
      const state = await graphQLService.getState(wallet.address);
      height = state.height;
    } else {
      height = await graphQLService.getCurrentHeight();
    }

    if (height && _height.value !== height) {
      _height.value = height;
    }
  }

  return {
    priceRates: _priceRates,
    isLoading: _loading,
    height: _height
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChainStore, import.meta.hot));
}
