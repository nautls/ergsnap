import { Box, isEmpty, orderBy, utxoSum } from "@fleet-sdk/common";
import { useStorage } from "@vueuse/core";
import { BigNumber } from "bignumber.js";
import { acceptHMRUpdate, defineStore } from "pinia";
import { onMounted, ref, watch } from "vue";
import { ERG_TOKEN_ID } from "../constants";
import { ParsedTransaction, parseTransaction } from "../models/transactionParser";
import { graphQLService } from "../services/graphqlService";
import { AssetInfo } from "../types";
import { useChainStore } from "./chainStore";
import { ergSnap, isMetamaskConnected, isMetamaskPresent } from "@/rpc";

const { freeze } = Object;
const fbn = (n: string): BigNumber => freeze(BigNumber(n)) as BigNumber;

const assetInfoSerializer = {
  read(raw: string): AssetInfo<BigNumber>[] {
    const data = JSON.parse(raw) as AssetInfo<string>[];
    return data.map((asset) => ({ tokenId: asset.tokenId, amount: fbn(asset.amount) }));
  },
  write(value: AssetInfo<BigNumber>[]): string {
    return JSON.stringify(value.map((x) => ({ tokenId: x.tokenId, amount: x.amount.toString() })));
  }
};

const txHistorySerializer = {
  read(raw: string): ParsedTransaction[] {
    const data = JSON.parse(raw) as ParsedTransaction<string>[];
    return data.map((tx) => ({
      ...tx,
      fee: tx.fee ? BigInt(tx.fee) : undefined,
      balance: tx.balance.map((asset) => ({
        tokenId: asset.tokenId,
        amount: fbn(asset.amount)
      }))
    }));
  },
  write(value: ParsedTransaction[]): string {
    return JSON.stringify(
      value.map((tx) => ({
        ...tx,
        fee: tx.fee?.toString(),
        balance: tx.balance.map((asset) => ({
          tokenId: asset.tokenId,
          amount: asset.amount.toString()
        }))
      }))
    );
  }
};

export const useWalletStore = defineStore("wallet", () => {
  const chain = useChainStore();

  const balance = ref<AssetInfo<BigNumber>[]>([]);
  const boxes = ref<Readonly<Box[]>>([]);
  const txHistory = ref<Readonly<ParsedTransaction[]>>([]);

  const loading = ref(true);
  const connected = ref(false);
  const address = ref("");

  let _fetchingBoxes = false;
  let _fetchingTxHistory = false;

  onMounted(async () => {
    connected.value =
      isMetamaskPresent() && isMetamaskConnected() && !!(await ergSnap.getVersion());
    if (connected.value) await loadAddress();

    loading.value = false;
  });

  watch(connected, async (connected) => {
    if (connected) {
      await loadAddress();
      loading.value = true;
    } else {
      boxes.value = [];
      txHistory.value = [];
    }

    loading.value = false;
  });

  watch(() => chain.height, update);
  watch(() => chain.mempoolTxIds, update, { deep: true });
  watch(boxes, updateBalance);
  watch(address, (addr) => {
    update();

    useStorage(`${addr}-balance`, balance, localStorage, { serializer: assetInfoSerializer });
    useStorage(`${addr}-tx-history`, txHistory, localStorage, { serializer: txHistorySerializer });
  });

  async function update() {
    return Promise.all([fetchBoxes(), fetchTxHistory()]);
  }

  async function fetchTxHistory() {
    if (!address.value || _fetchingTxHistory) return;
    _fetchingTxHistory = true;

    try {
      const txs = await graphQLService.getConfirmedTransactions(address.value);
      txHistory.value = orderBy(
        txs.map(parseTransaction(address.value)),
        (x) => x.timestamp,
        "desc"
      );

      // load assets metadata
      chain.loadMetadata(txHistory.value.flatMap((x) => x.balance.map((y) => y.tokenId)));
    } finally {
      _fetchingTxHistory = false;
    }
  }

  async function fetchBoxes() {
    if (!address.value || _fetchingBoxes) return;
    _fetchingBoxes = true;

    try {
      const response = await graphQLService.getBoxes({ where: { address: address.value } });
      boxes.value = freeze(response);
    } finally {
      _fetchingBoxes = false;
    }
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
    try {
      loading.value = true;
      connected.value = await ergSnap.connect();
    } finally {
      loading.value = false;
    }

    return connected.value;
  }

  return { connect, connected, loading, address, balance, txHistory };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWalletStore, import.meta.hot));
}
