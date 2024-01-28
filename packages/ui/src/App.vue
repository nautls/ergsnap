<script setup lang="ts">
import { Clock, Loader2 } from "lucide-vue-next";
import AppHeader from "./components/AppHeader.vue";
import TxHistory from "./components/TxHistory.vue";
import { useChainStore } from "./stories";
import BalanceView from "@/components/BalanceView.vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Toaster from "@/components/ui/toast/Toaster.vue";

const chain = useChainStore();
</script>

<template>
  <div class="flex min-h-screen flex-col items-center bg-foreground/5">
    <Card
      class="my-8 flex w-11/12 flex-grow flex-col gap-4 border p-4 shadow-2xl shadow-primary/10 sm:w-11/12 lg:w-8/12"
    >
      <AppHeader />

      <CardContent class="flex flex-grow flex-row gap-8">
        <BalanceView />

        <Card class="w-5/12">
          <CardHeader class="flex-row items-center justify-between space-y-0">
            <CardTitle class="text-sm font-medium">Transaction History</CardTitle>
            <Loader2 v-if="chain.waitingTransaction" class="animate-spin" :size="16" />
            <Clock v-else :size="14" />
          </CardHeader>

          <TxHistory />
        </Card>
      </CardContent>
    </Card>
  </div>
  <Toaster />
</template>
