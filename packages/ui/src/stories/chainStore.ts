import { isEmpty, some, uniq } from "@fleet-sdk/common";
import { useStorage } from "@vueuse/core";
import { acceptHMRUpdate, defineStore } from "pinia";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ERG_DECIMALS, ERG_TOKEN_ID } from "../constants";
import { AssetPriceRates, assetPricingService } from "../services/assetPricingService";
import { useWalletStore } from ".";
import { graphQLService } from "@/services/graphqlService";
import { AssetMetadata } from "@/types";

export type StateTokenMetadata = { [tokenId: string]: AssetMetadata };
const ERG_METADATA: AssetMetadata = { name: "ERG", decimals: ERG_DECIMALS };

export const useChainStore = defineStore("chain", () => {
  const wallet = useWalletStore();

  // private
  let _timer: number;

  // state
  const loading = ref(true);
  const height = ref(0);
  const mempoolTxIds = ref(new Set<string>());
  const prices = useStorage<AssetPriceRates>("prices-cache", {});
  const metadata = useStorage<StateTokenMetadata>("token-metadata-cache", {
    [ERG_TOKEN_ID]: ERG_METADATA
  });

  // watchers
  watch(height, (_, oldVal) => {
    if (!oldVal) return;

    loadPrices();
  });

  watch(
    () => wallet.balance,
    () => {
      if (isEmpty(wallet.balance)) return;

      const tokenIds = wallet.balance.map((x) => x.tokenId);
      loadMetadata(tokenIds);
    }
  );

  // hooks
  onMounted(async () => {
    _timer = setInterval(loadState, 4000) as unknown as number;

    await Promise.all([loadState(), loadPrices()]);
    loading.value = false;
  });

  onBeforeUnmount(() => {
    clearInterval(_timer);
  });

  async function loadPrices() {
    prices.value = await assetPricingService.getTokenRates();
  }

  async function loadState() {
    let newHeight = 0;

    if (wallet.address) {
      const state = await graphQLService.getState(wallet.address);
      newHeight = state.height;
      mempoolTxIds.value.clear();
      if (some(state.mempoolTransactionIds)) {
        state.mempoolTransactionIds.map((id) => mempoolTxIds.value.add(id));
      }
    } else {
      newHeight = await graphQLService.getCurrentHeight();
    }

    if (newHeight && height.value !== newHeight) {
      height.value = newHeight;
    }
  }

  async function loadMetadata(tokenIds: string[]) {
    const metadataTokenIds = Object.keys(metadata.value);
    tokenIds = tokenIds.filter((id) => !metadataTokenIds.includes(id));

    if (isEmpty(tokenIds)) {
      return;
    }

    tokenIds = uniq(tokenIds);

    for await (const tokensMetadata of graphQLService.streamMetadata(tokenIds)) {
      for (const meta of tokensMetadata) {
        metadata.value[meta.tokenId] = {
          name: meta?.name,
          decimals: meta.decimals
        };
      }
    }

    if (loading.value) {
      loading.value = false;
    }
  }

  return { prices, metadata, loading, height, mempoolTxIds, loadMetadata };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChainStore, import.meta.hot));
}
