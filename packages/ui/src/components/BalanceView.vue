<script setup lang="ts">
import { BigNumber } from "bignumber.js";
import { Download, Send, Sigma } from "lucide-vue-next";
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

const wallet = useWalletStore();
const chain = useChainStore();
const toastOpen = ref(false);
const modalOpen = ref(false);
const txId = ref("");

const ergBalance = computed(() => {
  let acc = BigNumber(0);

  for (const asset of wallet.balance) {
    acc = acc.plus(
      decimalizeBigNumber(
        asset.amount as BigNumber,
        chain.metadata[asset.tokenId]?.decimals ?? 0
      ).times(chain.prices[asset.tokenId]?.erg ?? 0)
    );
  }

  return formatBigNumber(acc, 4);
});

const fiatBalance = computed(() => {
  const rate = BigNumber(chain.prices[ERG_TOKEN_ID]?.fiat ?? 0);
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
      <CardHeader class="flex-row items-center justify-between space-y-0">
        <CardTitle class="text-sm font-medium">Total Balance</CardTitle>
        <Sigma :size="14" />
      </CardHeader>
      <CardContent class="flex justify-start gap-2">
        <div class="flex-grow">
          <h1 class="text-3xl font-bold">{{ ergBalance }} ERG</h1>
          <p class="text-xs text-muted-foreground">≈ {{ fiatBalance }} USD</p>
        </div>

        <Dialog v-model:open="modalOpen">
          <DialogTrigger as-child>
            <Button class="gap-2" size="sm" variant="secondary">
              <Send class="m-auto" :size="16" /> Send
            </Button>
          </DialogTrigger>
          <DialogContent class="max-h-[80vh] max-w-[24rem] overflow-auto">
            <SendView @success="onSuccessTX" />
          </DialogContent>
        </Dialog>
        <Popover>
          <PopoverTrigger as-child>
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
          <ScrollArea class="-mx-6 h-[17.9rem]">
            <div class="my-1">
              <div v-for="(asset, index) in wallet.balance" :key="asset.tokenId" class="px-6">
                <AssetRow root-class="py-4" logo-class="w-10" :asset="asset" :link="true" />
                <Separator v-if="index < wallet.balance.length - 1" />
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
