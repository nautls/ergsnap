<script setup lang="ts">
import { BigNumber } from "bignumber.js";
import { Download, Send, Sigma } from "lucide-vue-next";
import {
  ToastAction,
  ToastDescription,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport
} from "radix-vue";
import { computed, ref } from "vue";
import SendView from "./SendView.vue";
import AddressView from "@/components/AddressView.vue";
import AssetRow from "@/components/AssetRow.vue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ERG_TOKEN_ID } from "@/constants";
import { useChainStore, useWalletStore } from "@/stories";
import { decimalizeBigNumber, formatBigNumber } from "@/utils/assets";
import { getTransactionUrlFor } from "@/utils/explorer";

const wallet = useWalletStore();
const chain = useChainStore();
const toastOpen = ref(false);
const modalOpen = ref(false);
const txId = ref("");

const ergBalance = computed(() => {
  let acc = BigNumber(0);

  for (const asset of wallet.balance) {
    acc = acc.plus(
      decimalizeBigNumber(asset.amount as BigNumber, asset.metadata?.decimals ?? 0).times(
        chain.priceRates[asset.tokenId]?.erg ?? 0
      )
    );
  }

  return formatBigNumber(acc, 4);
});

const fiatBalance = computed(() => {
  const rate = BigNumber(chain.priceRates[ERG_TOKEN_ID]?.fiat ?? 0);
  return formatBigNumber(rate.times(ergBalance.value), 2);
});

function onSuccessTX(id: string) {
  txId.value = id;
  toastOpen.value = true;
  modalOpen.value = false;
}
</script>

<template>
  <div class="flex flex-grow flex-col gap-8">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Total Balance</CardTitle>
        <Sigma :size="14" />
      </CardHeader>
      <CardContent class="flex justify-start gap-2">
        <div class="flex-grow">
          <h1 class="text-3xl font-bold">{{ ergBalance }} ERG</h1>
          <p class="text-xs text-muted-foreground">≈ {{ fiatBalance }} USD</p>
        </div>

        <Dialog v-model:open="modalOpen">
          <DialogTrigger>
            <Button class="gap-2" size="sm" variant="secondary">
              <Send class="m-auto" :size="16" /> Send
            </Button>
          </DialogTrigger>
          <DialogContent class="max-w-[24rem]">
            <SendView @success="onSuccessTX" />
          </DialogContent>
        </Dialog>
        <!-- <Button class="gap-2" size="sm" variant="secondary" @click="toastOpen = true">
          <Send class="m-auto" :size="16" /> Send
        </Button> -->
        <Popover>
          <PopoverTrigger>
            <Button class="gap-2" size="sm" variant="secondary">
              <Download class="m-auto" :size="16" /> Receive
            </Button>
          </PopoverTrigger>
          <PopoverContent><AddressView /></PopoverContent>
        </Popover>
      </CardContent>
    </Card>

    <div>
      <Card class="flex-grow">
        <CardContent class="py-1">
          <ScrollArea class="-mx-6 h-[19rem]">
            <div class="my-1">
              <div v-for="(asset, index) in wallet.balance" :key="asset.tokenId" class="px-6">
                <AssetRow root-class="py-4" :asset="asset" :link="true" />
                <Separator v-if="index < wallet.balance.length - 1" />
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <ToastProvider>
        <ToastRoot
          v-model:open="toastOpen"
          :duration="10000"
          class="data-[state=open]:animate-slideIn data-[state=closed]:animate-hide data-[swipe=end]:animate-swipeOut grid grid-cols-[auto_max-content] items-center gap-x-[15px] rounded-lg border bg-card p-[15px] text-card-foreground shadow-sm [grid-template-areas:_'title_action'_'description_action'] data-[swipe=cancel]:translate-x-0 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:transition-[transform_200ms_ease-out]"
        >
          <ToastTitle class="text-slate12 mb-[5px] text-[15px] font-medium [grid-area:_title]">
            Success!
          </ToastTitle>
          <ToastDescription as-child
            ><a
              class="url pt-2 text-sm font-normal"
              :href="getTransactionUrlFor(txId)"
              target="_blank"
              rel="noopener noreferrer"
              >View transaction on Explorer</a
            ></ToastDescription
          >
          <ToastAction class="[grid-area:_action]" as-child alt-text="Close">
            <Button size="sm" variant="outline">Close</Button>
          </ToastAction>
        </ToastRoot>
        <ToastViewport
          class="fixed bottom-0 right-0 z-[2147483647] m-0 flex w-[390px] max-w-[100vw] list-none flex-col gap-[10px] p-[var(--viewport-padding)] outline-none [--viewport-padding:_25px]"
        />
      </ToastProvider>
    </div>
  </div>
</template>
