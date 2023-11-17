<script setup lang="ts">
import { isEmpty, undecimalize } from "@fleet-sdk/common";
import {
  ErgoAddress,
  OutputBuilder,
  SAFE_MIN_BOX_VALUE,
  TransactionBuilder
} from "@fleet-sdk/core";
import BigNumber from "bignumber.js";
import { differenceBy } from "lodash-es";
import { ChevronsUpDown } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { ERG_DECIMALS } from "../constants";
import { ergSnap } from "../rpc";
import { graphQLService } from "../services/graphqlService";
import { AssetInfo } from "../types";
import { decimalizeBigNumber, displayAmount, displayName } from "../utils/assets";
import AssetIcon from "./AssetIcon.vue";
import AssetInput from "./AssetInput.vue";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from "@/components/ui/command";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useChainStore, useWalletStore } from "@/stories";

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
  selected.value[0].amount = decimalizeBigNumber(
    BigNumber(SAFE_MIN_BOX_VALUE.toString()),
    ERG_DECIMALS
  ).toString();
});

function select(asset: Asset) {
  selectorOpened.value = false;
  selected.value.push({
    amount: "0",
    tokenId: asset.tokenId,
    info: asset
  });
}

async function sign() {
  loading.value = true;
  loadingStatus.value = "Fetching inputs...";
  const address = ErgoAddress.fromBase58(wallet.address);
  const inputs = await graphQLService.getBoxes({ spent: false, ergoTrees: [address.ergoTree] });
  const erg = undecimalize(selected.value[0].amount, ERG_DECIMALS);
  const unsigned = new TransactionBuilder(chain.height)
    .from(inputs)
    .to(
      new OutputBuilder(erg, recipient.value).addTokens(
        selected.value
          .filter((x) => x.info.tokenId !== "ERG")
          .map((x) => ({
            tokenId: x.tokenId,
            amount: undecimalize(x.amount, x.info.metadata?.decimals ?? 0)
          }))
      )
    )
    .sendChangeTo(address)
    .payMinFee()
    .build()
    .toEIP12Object();

  loadingStatus.value = "Signing...";
  const signed = await ergSnap.signTx(unsigned);

  loadingStatus.value = "Sending...";
  const txId = await graphQLService.sendTransaction(signed);

  emit("success", txId);
  loading.value = false;
}
</script>

<template>
  <DialogHeader>
    <DialogTitle>Send</DialogTitle>
    <DialogDescription> Use this tool to send assets. </DialogDescription>
  </DialogHeader>

  <Label for="recipient">Recipient</Label>
  <Input id="recipient" v-model="recipient" placeholder="Recipient address" />
  <Label>Assets</Label>
  <AssetInput
    v-for="asset in selected"
    :key="asset.tokenId"
    v-model="asset.amount"
    :asset="asset.info"
  />
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
        <CommandInput placeholder="Search framework..." />
        <CommandEmpty>No asset found.</CommandEmpty>
        <CommandGroup>
          <CommandItem
            v-for="asset in unselected"
            :key="asset.tokenId"
            class="gap-2"
            :value="displayName(asset)"
            @select="select(asset)"
          >
            <AssetIcon :token-id="asset.tokenId" custom-class="w-5" />
            <div class="flex-grow">{{ displayName(asset) }}</div>
            {{ displayAmount(asset) }}
          </CommandItem>
        </CommandGroup>
      </Command>
    </PopoverContent>
  </Popover>

  <DialogFooter>
    <DialogClose as-child>
      <Button variant="outline">Cancel</Button>
    </DialogClose>

    <Button :loading="loading" class="gap-2" @click="sign()"
      >Send <template #loading>Sending...</template></Button
    >
  </DialogFooter>
</template>
