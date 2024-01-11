<script setup lang="ts">
import { isEmpty, undecimalize } from "@fleet-sdk/common";
import { ErgoAddress, OutputBuilder, TransactionBuilder } from "@fleet-sdk/core";
import BigNumber from "bignumber.js";
import { differenceBy } from "lodash-es";
import { ChevronsUpDown } from "lucide-vue-next";
import { useForm } from "vee-validate";
import { computed, onMounted, ref } from "vue";
import { ERG_DECIMALS } from "../constants";
import { ergSnap } from "../rpc";
import { graphQLService } from "../services/graphqlService";
import { AssetInfo } from "../types";
import { displayAmount, displayName } from "../utils/assets";
import AssetIcon from "./AssetIcon.vue";
import AssetInput from "./AssetInput.vue";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toast/use-toast";
import { useChainStore, useWalletStore } from "@/stories";
import { shorten } from "@/utils/string";

const { handleSubmit } = useForm();
const { toast } = useToast();

type Asset = AssetInfo<Readonly<BigNumber>>;
type SelectedAsset = {
  amount: string;
  tokenId: string;
  info: Asset;
};

const emit = defineEmits(["success"]);

const wallet = useWalletStore();
const chain = useChainStore();

const loading = ref(false);
const loadingStatus = ref("");
const selectorOpened = ref(false);
const recipient = ref("");
const selected = ref<SelectedAsset[]>([]);
const unselected = computed(() => {
  if (isEmpty(selected.value)) {
    return wallet.balance;
  }

  return differenceBy(wallet.balance, selected.value, (x) => x.tokenId);
});

onMounted(() => {
  select(wallet.balance[0]);
});

function select(asset: Asset) {
  selectorOpened.value = false;
  selected.value.push({
    amount: "",
    tokenId: asset.tokenId,
    info: asset
  });
}

async function sign() {
  loading.value = true;
  loadingStatus.value = "Fetching inputs...";
  const address = ErgoAddress.fromBase58(wallet.address);
  const inputs = await graphQLService.getBoxes({ where: { ergoTree: address.ergoTree } });
  const erg = undecimalize(selected.value[0].amount, ERG_DECIMALS);
  const unsigned = new TransactionBuilder(chain.height)
    .from(inputs)
    .to(
      new OutputBuilder(erg, recipient.value).addTokens(
        selected.value
          .filter((x) => x.info.tokenId !== "ERG")
          .map((x) => ({
            tokenId: x.tokenId,
            amount: undecimalize(x.amount, chain.metadata[x.tokenId]?.decimals ?? 0)
          }))
      )
    )
    .sendChangeTo(address)
    .payMinFee()
    .build()
    .toEIP12Object();
  console.log(unsigned);
  loadingStatus.value = "Signing...";
  const signed = await ergSnap.signTx(unsigned);

  loadingStatus.value = "Sending...";
  const response = await graphQLService.submitTransaction(signed);

  if (response.success) {
    const txId = response.transactionId;
    toast({
      title: "Success!",
      description: `Transaction ${shorten(txId, 20)} has been submitted to the blockchain.`
    });

    emit("success", txId);
  } else {
    toast({
      title: "Something went wrong",
      description: response.message,
      variant: "destructive"
    });
  }

  loading.value = false;
}

const onSubmit = handleSubmit((values) => {
  console.log("Form submitted!", values);
  sign();
});
</script>

<template>
  <DialogHeader>
    <DialogTitle>Send</DialogTitle>
    <DialogDescription>Use this tool to send assets.</DialogDescription>
  </DialogHeader>

  <form id="send-form" class="space-y-4" @submit="onSubmit">
    <FormField v-slot="{ componentField }" v-model="recipient" name="recipient">
      <FormItem>
        <FormLabel>Recipient</FormLabel>
        <FormControl>
          <Input type="text" placeholder="Recipient address" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <div class="space-y-2">
      <FormField
        v-for="(asset, index) in selected"
        v-slot="{ componentField }"
        :key="asset.tokenId"
        v-model="asset.amount"
        :name="`asset[${index}]`"
      >
        <FormItem>
          <FormLabel v-if="index === 0">Assets</FormLabel>
          <FormControl>
            <AssetInput v-bind="componentField" :asset="asset.info" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>
  </form>

  <Separator />

  <Popover v-model:open="selectorOpened">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="selectorOpened"
        class="justify-between"
      >
        {{ "Add asset..." }}

        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[21rem] p-0">
      <Command>
        <CommandInput placeholder="Search assets..." />
        <CommandList>
          <CommandEmpty>No asset found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="asset in unselected"
              :key="asset.tokenId"
              class="gap-2"
              :value="displayName(asset, chain)"
              @select="select(asset)"
            >
              <AssetIcon :token-id="asset.tokenId" custom-class="w-5" />
              <div class="flex-grow">{{ displayName(asset, chain) }}</div>
              {{ displayAmount(asset, chain) }}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>

  <DialogFooter>
    <DialogClose as-child>
      <Button variant="outline">Cancel</Button>
    </DialogClose>

    <Button type="submit" form="send-form" :loading="loading" class="gap-2"
      >Send <template #loading>Sending...</template></Button
    >
  </DialogFooter>
</template>
