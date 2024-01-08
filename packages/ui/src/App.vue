<script setup lang="ts">
import { Clock } from "lucide-vue-next";
import AppHeader from "./components/AppHeader.vue";
import BalanceView from "@/components/BalanceView.vue";
import { Card, CardContent } from "@/components/ui/card";
import Toaster from "@/components/ui/toast/Toaster.vue";
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
  <Toaster />
</template>
