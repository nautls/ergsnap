import { Box, isEmpty, orderBy, utxoSum } from "@fleet-sdk/common";
import { BigNumber } from "bignumber.js";
import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, onMounted, ref, watch } from "vue";
import { ERG_DECIMALS, ERG_TOKEN_ID } from "../constants";
import { graphQLService } from "../services/graphqlService";
import { AssetInfo } from "../types";
import { useChainStore } from "./chainStore";
import { ergSnap, isMetamaskConnected, isMetamaskPresent } from "@/rpc";

const { freeze } = Object;
const fbn = (n: string): BigNumber => freeze(BigNumber(n)) as BigNumber;

export const useWalletStore = defineStore("wallet", () => {
  const chain = useChainStore();

  const _balance = ref<AssetInfo<BigNumber>[]>([]);
  const _boxes = ref<Readonly<Box[]>>([]);

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

  watch(() => chain.height, fetchBoxes);
  watch(address, fetchBoxes);
  watch(_boxes, updateBalance);

  async function fetchBoxes() {
    if (!address.value) return;

    _boxes.value = freeze(await graphQLService.getBoxes({ where: { address: address.value } }));
  }

  function updateBalance() {
    if (isEmpty(_boxes)) {
      _balance.value = [];
      return;
    }

    const summary = utxoSum(_boxes.value);
    const newBalance = orderBy<AssetInfo<BigNumber>>(
      summary.tokens.map(
        (x): AssetInfo<BigNumber> => ({
          tokenId: x.tokenId,
          amount: fbn(x.amount.toString())
          // metadata: { decimals: x.decimals ?? 0, name: x.name ?? "" }
        })
      ),
      (x) => x.tokenId
    );

    newBalance.unshift({
      tokenId: ERG_TOKEN_ID,
      amount: fbn(summary.nanoErgs.toString()),
      metadata: { decimals: ERG_DECIMALS, name: "ERG" }
    });

    _balance.value = newBalance;
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
