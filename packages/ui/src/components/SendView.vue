<script setup lang="ts">
import { decimalize, isEmpty, undecimalize } from "@fleet-sdk/common";
import {
  ErgoAddress,
  OutputBuilder,
  SAFE_MIN_BOX_VALUE,
  TransactionBuilder
} from "@fleet-sdk/core";
import BigNumber from "bignumber.js";
import { differenceBy } from "lodash-es";
import { ChevronsUpDown } from "lucide-vue-next";
import { GenericValidateFunction, useForm } from "vee-validate";
import { computed, onMounted, ref } from "vue";
import { ERG_DECIMALS, ERG_TOKEN_ID } from "../constants";
import { ergSnap } from "../rpc";
import { graphQLService } from "../services/graphqlService";
import { AssetInfo } from "../types";
import { BigN, displayAmount, displayName, undecimalizeBigNumber } from "../utils/assets";
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

const MIN_ERG_AMOUNT = BigNumber(SAFE_MIN_BOX_VALUE.toString());
const DECIMALIZED_MIN_ERG_AMOUNT = decimalize(SAFE_MIN_BOX_VALUE, ERG_DECIMALS);

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

const ergAmount = computed(() => {
  const erg = selected.value[0];
  return undecimalize(erg?.amount ?? "0", ERG_DECIMALS);
});

onMounted(() => {
  select(wallet.balance[0]);
});

function select(asset: Asset) {
  selectorOpened.value = false;

  if (asset.tokenId !== "ERG" && ergAmount.value < SAFE_MIN_BOX_VALUE) {
    const erg = selected.value[0];
    erg.amount = decimalize(SAFE_MIN_BOX_VALUE, ERG_DECIMALS);
  }

  selected.value.push({
    amount: "",
    tokenId: asset.tokenId,
    info: asset
  });
}

async function send() {
  loading.value = true;
  loadingStatus.value = "Loading...";
  const address = ErgoAddress.fromBase58(wallet.address);
  const inputs = await graphQLService.getBoxes({ where: { ergoTree: address.ergoTree } });
  const erg = undecimalize(selected.value[0].amount, ERG_DECIMALS);
  const unsigned = new TransactionBuilder(chain.height)
    .from(inputs)
    .to(
      new OutputBuilder(erg, recipient.value).addTokens(
        selected.value
          .map((x) => ({
            tokenId: x.tokenId,
            amount: undecimalize(x.amount, chain.metadata[x.tokenId]?.decimals ?? 0)
          }))
          .filter((x) => x.amount > 0n && x.tokenId !== ERG_TOKEN_ID)
      )
    )
    .sendChangeTo(address)
    .payMinFee()
    .build()
    .toEIP12Object();

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
  loadingStatus.value = "";
}

const addressValidator = ((value: string) => {
  if (isEmpty(value)) return "Recipient address is required";
  return ErgoAddress.validate(value) ? true : "Invalid Ergo address";
}) as GenericValidateFunction<unknown>; // a little hack to make it work with vee-validate, as it explicitly expects value to be `unknown`

function assetValidator(info: AssetInfo<BigN>): GenericValidateFunction<unknown> {
  return ((value: string) => {
    if (isEmpty(value) && info.tokenId === ERG_TOKEN_ID) return "ERG amount is required";
    const metadata = chain.metadata[info.tokenId];
    const decimals = metadata?.decimals;
    const name = metadata?.name ?? shorten(info.tokenId, 10);
    const amount = undecimalizeBigNumber(BigNumber(value), decimals);

    if (info.tokenId === ERG_TOKEN_ID && amount.lt(MIN_ERG_AMOUNT)) {
      return `Minimum amount is ${DECIMALIZED_MIN_ERG_AMOUNT} ERG`;
    }
    if (amount.isNegative()) return `${name} amount must be greater than 0`;
    if (amount.gt(info.amount)) return `Insufficient ${name} balance`;

    return true;
  }) as GenericValidateFunction<unknown>; //  // a little hack to make it work with vee-validate, as it explicitly expects value to be `unknown`
}

const onSubmit = handleSubmit(async () => {
  try {
    await send();
  } catch (e) {
    loading.value = false;
    loadingStatus.value = "";

    toast({
      title: "Something went wrong",
      description: (e as Error).message,
      variant: "destructive"
    });
  }
});
</script>

<template>
  <DialogHeader>
    <DialogTitle>Send</DialogTitle>
    <DialogDescription>Use this tool to send assets.</DialogDescription>
  </DialogHeader>

  <form id="send-form" class="space-y-4" novalidate @submit="onSubmit">
    <FormField
      v-slot="{ componentField }"
      v-model="recipient"
      name="recipient"
      :rules="addressValidator"
    >
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
        :name="`assets[${index}]`"
        :rules="assetValidator(asset.info)"
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
      <Button variant="outline" :disabled="loading">Cancel</Button>
    </DialogClose>

    <Button type="submit" form="send-form" :loading="loading" class="gap-2" :disabled="loading"
      >Send <template #loading>{{ loadingStatus }}</template></Button
    >
  </DialogFooter>
</template>
