<script setup lang="ts">
import { useColorMode } from "@vueuse/core";
import { Moon, Sun } from "lucide-vue-next";
import ErgoLogo from "@/assets/ergo.svg";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWalletStore } from "@/stories";
import { copy } from "@/utils/clipboard";
import { shorten } from "@/utils/string";

const { toast } = useToast();
const walletStore = useWalletStore();
const theme = useColorMode();

function copyAddress() {
  copy(walletStore.address);
  toast({
    title: "Copied!",
    description: "Your address has been copied to the clipboard."
  });
}

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
}
</script>

<template>
  <CardHeader class="flex-row items-center gap-2 space-y-0">
    <ErgoLogo class="h-10 w-10" />
    <CardTitle class="flex-grow cursor-default tracking-normal">Ergo Wallet</CardTitle>

    <div class="flex gap-2">
      <Button
        v-if="!walletStore.address"
        class="gap-2"
        variant="outline"
        :loading="walletStore.loading"
        @click="walletStore.connect()"
      >
        Connect Wallet
        <template #loading>Connecting...</template>
      </Button>

      <TooltipProvider v-else :delay-duration="200">
        <Tooltip>
          <TooltipTrigger>
            <Button variant="secondary" @click="copyAddress">
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
