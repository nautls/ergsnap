<script setup lang="ts">
import { renderSVG } from "uqr";
import { onMounted, ref, watch } from "vue";
import { copy } from "../utils/clipboard";
import Button from "./ui/button/Button.vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { useWalletStore } from "@/stories";

const { toast } = useToast();
const wallet = useWalletStore();
const svg = ref("");

onMounted(generateQRCode);
watch(() => wallet.address, generateQRCode);

function generateQRCode() {
  svg.value = renderSVG(wallet.address, { ecc: "L", border: 0 });
}

function copyAddress() {
  copy(wallet.address);
  toast({
    title: "Copied!",
    description: "Your address has been copied to the clipboard."
  });
}
</script>

<template>
  <div class="w-64 space-y-8 p-2">
    <div class="flex flex-col gap-4">
      <div class="m-auto inline-block w-9/12 rounded-md border bg-white p-4" v-html="svg"></div>
      <div class="break-all rounded-md bg-secondary p-4 text-sm text-secondary-foreground">
        {{ wallet.address }}
      </div>
    </div>

    <Button size="sm" class="w-full" @click="copyAddress">Copy address</Button>
  </div>
</template>
