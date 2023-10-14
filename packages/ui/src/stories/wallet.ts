import { acceptHMRUpdate, defineStore } from "pinia";
import { onMounted, ref, watch } from "vue";
import { ergSnap, isMetamaskConnected, isMetamaskPresent } from "@/rpc";

export const useWalletStore = defineStore("wallet", () => {
  const isLoading = ref(true);
  const isConnected = ref(false);
  const address = ref("");

  onMounted(async () => {
    const connected =
      isMetamaskPresent() &&
      isMetamaskConnected() &&
      (await ergSnap.getVersion());

    if (connected) {
      await loadAddress();
    }

    isLoading.value = false;
  });

  async function loadAddress() {
    address.value = await ergSnap.getAddress();
  }

  async function connect() {
    isLoading.value = true;
    isConnected.value = await ergSnap.connect();
    return isConnected.value;
  }

  watch(isConnected, async (connected) => {
    if (connected) {
      isLoading.value = true;
      await loadAddress();
    }

    isLoading.value = false;
  });

  return { connect, isConnected, isLoading, address };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWalletStore, import.meta.hot));
}
