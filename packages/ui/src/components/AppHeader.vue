<script setup lang="ts">
import { useColorMode } from "@vueuse/core";
import { Moon, Sun } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWalletStore } from "@/stories";
import { copy } from "@/utils/clipboard";
import { shorten } from "@/utils/string";

const walletStore = useWalletStore();
const theme = useColorMode();

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
}
</script>

<template>
  <CardHeader class="flex-row items-center gap-2 space-y-0">
    <img src="../assets/ergo.svg" alt="Nautilus Wallet" class="w-10" />
    <CardTitle class="flex-grow cursor-default tracking-normal">Ergo Wallet</CardTitle>

    <div class="flex gap-2">
      <Button
        v-if="!walletStore.address"
        class="gap-2"
        variant="outline"
        :loading="walletStore.isLoading"
        @click="walletStore.connect()"
      >
        Connect
        <template #loading>Connecting...</template>
      </Button>

      <TooltipProvider v-else :delay-duration="200">
        <Tooltip>
          <TooltipTrigger>
            <Button variant="secondary" @click="copy(walletStore.address)">
              {{ shorten(walletStore.address, 10) }}</Button
            ></TooltipTrigger
          >
          <TooltipContent>
            <p>Click to copy</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button size="icon" variant="outline" @click="toggleTheme()">
        <Moon v-if="theme === 'dark'" :size="16" />
        <Sun v-else :size="16" />
      </Button>
    </div>
  </CardHeader>
</template>
