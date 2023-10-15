<script setup lang="ts">
import { BigNumber } from "bignumber.js";
import { Clock, Download, Send, Sigma } from "lucide-vue-next";
import { computed } from "vue";
import AddressView from "./components/AddressView.vue";
import AppHeader from "./components/AppHeader.vue";
import AssetRow from "./components/AssetRow.vue";
import { ERG_TOKEN_ID } from "./constants";
import { decimalizeBigNumber, formatBigNumber } from "./utils/assets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useChainStore, useWalletStore } from "@/stories";

const wallet = useWalletStore();
const chain = useChainStore();

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
</script>

<template>
  <div class="flex min-h-screen flex-col items-center bg-foreground/5">
    <Card
      class="my-8 flex w-11/12 flex-grow flex-col gap-4 border p-4 shadow-2xl shadow-primary/10 sm:w-11/12 lg:w-8/12"
    >
      <AppHeader />

      <CardContent class="flex flex-grow flex-row gap-8">
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
              <Button class="gap-2" size="sm" variant="secondary">
                <Send class="m-auto" :size="16" /> Send
              </Button>
              <div>
                <Popover>
                  <PopoverTrigger>
                    <Button class="gap-2" size="sm" variant="secondary">
                      <Download class="m-auto" :size="16" /> Receive
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent><AddressView /></PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

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
        </div>

        <Card class="w-5/12">
          <CardContent class="flex h-full pt-6 align-middle">
            <div class="m-auto cursor-default space-y-4">
              <Clock class="m-auto text-muted-foreground/30" :size="64" />
              <p class="text-muted-foreground">No transactions</p>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  </div>
</template>
