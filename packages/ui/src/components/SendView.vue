<script setup lang="ts">
import { Send } from "lucide-vue-next";
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

      <Input />

      <DialogFooter> Save changes </DialogFooter>
    </DialogContent>
  </Dialog>
</template>