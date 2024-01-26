<script setup lang="ts">
import { decimalize, isEmpty } from "@fleet-sdk/common";
import { formatTimeAgo } from "@vueuse/core";
import BigNumber from "bignumber.js";
import { Clock } from "lucide-vue-next";
import { ERG_DECIMALS } from "../constants";
import { useChainStore, useWalletStore } from "../stories";
import { formatBigNumber } from "../utils/assets";
import { shorten } from "../utils/string";
import AssetRow from "./AssetRow.vue";
import ExplorerLink from "./ExplorerLink.vue";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const wallet = useWalletStore();
const chain = useChainStore();
</script>

<template>
  <CardContent class="flex h-[24.8rem] w-full px-0 py-1 align-middle">
    <div v-if="isEmpty(wallet.history)" class="m-auto cursor-default space-y-4">
      <Clock class="m-auto text-muted-foreground/30" :size="60" />
      <p class="text-muted-foreground">No transactions</p>
    </div>

    <ScrollArea v-else class="w-full">
      <div class="space-y-6 px-6 text-sm">
        <div v-for="(tx, index) in wallet.history" :key="tx.transactionId" class="w-full space-y-2">
          <div class="flex items-center justify-between">
            <ExplorerLink type="transaction" :value="tx.transactionId"
              ><Badge variant="secondary">{{ shorten(tx.transactionId, 25) }}</Badge>
            </ExplorerLink>
            <div class="text-xs">
              {{ formatTimeAgo(new Date(tx.timestamp)) }}
            </div>
          </div>
          <div>
            <div v-for="asset in tx.balance" :key="asset.tokenId">
              <AssetRow
                root-class="py-1 gap-2"
                link
                display-signaling
                :asset="asset"
                logo-class="h-6"
                :display-price="false"
              />
            </div>
          </div>
          <div class="flex justify-between pb-4 pt-1">
            <Badge v-if="tx.fee" variant="outline" class="font-normal"
              >Fee: {{ decimalize(tx.fee, ERG_DECIMALS) }} ERG</Badge
            >
            <Badge v-if="tx.inclusionHeight" variant="success">
              {{ formatBigNumber(BigNumber(chain.height - tx.inclusionHeight + 1)) }} confirmations
            </Badge>
            <Badge v-else variant="warning"> Unconfirmed </Badge>
          </div>
          <Separator v-if="index < wallet.history.length - 1" />
        </div>
      </div>
    </ScrollArea>
  </CardContent>
</template>
