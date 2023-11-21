import { Box, isEmpty, orderBy, utxoSum } from "@fleet-sdk/common";
import { useStorage } from "@vueuse/core";
import { BigNumber } from "bignumber.js";
import { acceptHMRUpdate, defineStore } from "pinia";
import { onMounted, ref, watch } from "vue";
import { ERG_TOKEN_ID } from "../constants";
import { graphQLService } from "../services/graphqlService";
import { AssetInfo } from "../types";
import { useChainStore } from "./chainStore";
import { ergSnap, isMetamaskConnected, isMetamaskPresent } from "@/rpc";

const { freeze } = Object;
const fbn = (n: string): BigNumber => freeze(BigNumber(n)) as BigNumber;

const balanceSerializer = {
  read(raw: string): AssetInfo<BigNumber>[] {
    const data = JSON.parse(raw) as AssetInfo<string>[];
    return data.map((asset) => ({
      tokenId: asset.tokenId,
      amount: fbn(asset.amount)
    }));
  },
  write(value: AssetInfo<BigNumber>[]): string {
    return JSON.stringify(value.map((x) => ({ tokenId: x.tokenId, amount: x.amount.toString() })));
  }
};

export const useWalletStore = defineStore("wallet", () => {
  const chain = useChainStore();

  const balance = useStorage<AssetInfo<BigNumber>[]>("balance-cache", [], localStorage, {
    serializer: balanceSerializer,
    listenToStorageChanges: false
  });
  const boxes = ref<Readonly<Box[]>>([]);

  const loading = ref(true);
  const connected = ref(false);
  const address = ref("");

  onMounted(async () => {
    const connected = isMetamaskPresent() && isMetamaskConnected() && (await ergSnap.getVersion());

    if (connected) {
      await loadAddress();
    }

    loading.value = false;
  });

  watch(connected, async (connected) => {
    if (connected) {
      await loadAddress();
      loading.value = true;
    }

    loading.value = false;
  });

  watch(() => chain.height, fetchBoxes);
  watch(address, fetchBoxes);
  watch(boxes, updateBalance);

  async function fetchBoxes() {
    if (!address.value) return;

    boxes.value = freeze(await graphQLService.getBoxes({ where: { address: address.value } }));
  }

  function updateBalance() {
    if (isEmpty(boxes)) {
      balance.value = [];
      return;
    }

    const summary = utxoSum(boxes.value);
    const newBalance = orderBy<AssetInfo<BigNumber>>(
      summary.tokens.map(
        (x): AssetInfo<BigNumber> => ({
          tokenId: x.tokenId,
          amount: fbn(x.amount.toString())
        })
      ),
      (x) => x.tokenId
    );

    newBalance.unshift({
      tokenId: ERG_TOKEN_ID,
      amount: fbn(summary.nanoErgs.toString())
    });

    balance.value = newBalance;
  }

  async function loadAddress() {
    address.value = await ergSnap.getAddress();
  }

  async function connect() {
    loading.value = true;
    connected.value = await ergSnap.connect();
    return connected.value;
  }

  return { connect, connected, loading, address, balance };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWalletStore, import.meta.hot));
}
