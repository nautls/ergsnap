<script setup lang="ts">
import { useColorMode } from "@vueuse/core";
import { Clock, Download, Moon, Send, Sigma, Sun } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { connectSnap, sendHello } from "@/utils/snap";

const theme = useColorMode();

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center bg-foreground/5">
    <Card
      class="my-8 flex w-11/12 flex-grow flex-col gap-4 border p-4 shadow-xl shadow-primary/5 sm:w-11/12 lg:w-8/12"
    >
      <CardHeader class="flex-row items-center gap-2 space-y-0">
        <img src="./assets/ergo.svg" alt="Nautilus Wallet" class="w-10" />
        <CardTitle class="flex-grow cursor-default tracking-normal"
          >Ergo Wallet</CardTitle
        >

        <div class="flex gap-2">
          <div class="flex-grow"></div>
          <Button variant="outline" @click="connectSnap()">Connect</Button>
          <Button size="icon" variant="outline" @click="toggleTheme()">
            <Moon v-if="theme === 'dark'" :size="16" />
            <Sun v-else :size="16" />
          </Button>
        </div>
      </CardHeader>

      <CardContent class="flex flex-grow flex-row gap-8">
        <div class="flex flex-grow flex-col gap-8">
          <Card>
            <CardHeader
              class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
              <CardTitle class="text-sm font-medium">Total Balance</CardTitle>
              <Sigma :size="14" />
            </CardHeader>
            <CardContent class="flex justify-start gap-2">
              <div class="flex-grow">
                <h1 class="text-3xl font-bold">823.07 ERG</h1>
                <p class="text-xs text-muted-foreground">≈ 1,309.48 USD</p>
              </div>
              <Button
                class="gap-2"
                size="sm"
                variant="secondary"
                @click="sendHello"
              >
                <Send class="m-auto" :size="16" /> Send
              </Button>
              <Button class="gap-2" size="sm" variant="secondary">
                <Download class="m-auto" :size="16" /> Receive
              </Button>
            </CardContent>
          </Card>

          <Card class="flex-grow"> </Card>
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
