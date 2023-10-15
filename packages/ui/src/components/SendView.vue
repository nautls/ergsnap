<script setup lang="ts">
import { Send } from "lucide-vue-next";
import { ref } from "vue";
import CleaveInput from "./CleaveInput.vue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const v = ref("0");
</script>

<template>
  <Dialog>
    <DialogTrigger>
      <Button class="gap-2" size="sm" variant="secondary">
        <Send class="m-auto" :size="16" /> Send
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Send</DialogTitle>
        <DialogDescription> Use this tool to send assets. </DialogDescription>
      </DialogHeader>

      <Label for="recipient">Recipient</Label>
      <Input id="recipient" placeholder="Recipient address" />

      <Label>Asset</Label>
      <CleaveInput
        v-model="v"
        :options="{
          numeral: true,
          numeralPositiveOnly: true,
          numeralDecimalScale: 0
        }"
      />

      <DialogFooter> Save changes </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
