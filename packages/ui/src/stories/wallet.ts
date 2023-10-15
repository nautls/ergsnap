import { isEmpty, orderBy } from "@fleet-sdk/common";
import { BigNumber } from "bignumber.js";
import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, onMounted, ref, watch } from "vue";
import { ERG_DECIMALS, ERG_TOKEN_ID } from "../constants";
import { graphQLService } from "../services/graphqlService";
import { AssetInfo } from "../types";
import { useChainStore } from "./chain";
import { ergSnap, isMetamaskConnected, isMetamaskPresent } from "@/rpc";

const fbn = (n: string): BigNumber => Object.freeze(BigNumber(n)) as BigNumber;

export const useWalletStore = defineStore("wallet", () => {
  const chain = useChainStore();
  const _balance = ref<AssetInfo<BigNumber>[]>([]);

  const isLoading = ref(true);
  const isConnected = ref(false);
  const address = ref("");

  const balance = computed(() => _balance.value);

  onMounted(async () => {
    const connected = isMetamaskPresent() && isMetamaskConnected() && (await ergSnap.getVersion());

    if (connected) {
      await loadAddress();
    }

    isLoading.value = false;
  });

  watch(isConnected, async (connected) => {
    if (connected) {
      await loadAddress();
      isLoading.value = true;
    }

    isLoading.value = false;
  });

  watch(() => chain.height, updateBalance);
  watch(address, updateBalance);

  async function updateBalance() {
    const balances = await graphQLService.getBalance([address.value]);
    if (isEmpty(balances)) {
      _balance.value = [];
      return;
    }

    const b = balances[0];
    _balance.value = orderBy(
      b.assets.map(
        (x): AssetInfo<BigNumber> => ({
          tokenId: x.tokenId,
          amount: fbn(x.amount),
          metadata: { decimals: x.decimals ?? 0, name: x.name ?? "" }
        })
      ),
      (x) => x.tokenId
    );
    _balance.value.unshift({
      tokenId: ERG_TOKEN_ID,
      amount: fbn(b.nanoErgs),
      metadata: { decimals: ERG_DECIMALS, name: "ERG" }
    });
  }

  async function loadAddress() {
    address.value = await ergSnap.getAddress();
  }

  async function connect() {
    isLoading.value = true;
    isConnected.value = await ergSnap.connect();
    return isConnected.value;
  }

  return { connect, isConnected, isLoading, address, balance };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWalletStore, import.meta.hot));
}
