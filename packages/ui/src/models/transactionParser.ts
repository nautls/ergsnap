import { Transaction as GQLTransaction } from "@ergo-graphql/types";
import { BoxSummary, utxoDiff } from "@fleet-sdk/common";
import { ErgoAddress, FEE_CONTRACT } from "@fleet-sdk/core";
import BigNumber from "bignumber.js";
import { ERG_TOKEN_ID } from "../constants";
import { AssetInfo } from "../types";

const FEE_ADDRESS = ErgoAddress.fromErgoTree(FEE_CONTRACT).encode();

export type ParsedTransaction<T = BigNumber> = {
  transactionId: string;
  timestamp: number;
  inclusionHeight: number;
  fee?: bigint;
  balance: AssetInfo<T>[];
};

export function parseTransaction(ownerAddress: string) {
  return (rawTx: GQLTransaction): ParsedTransaction => {
    const ownInputs = rawTx.inputs
      .filter((x) => x.box?.address === ownerAddress)
      .map((x) => x.box!);

    const outputs = rawTx.outputs.filter((x) => x.address === ownerAddress);

    return {
      transactionId: rawTx.transactionId,
      timestamp: Number(rawTx.timestamp),
      inclusionHeight: rawTx.inclusionHeight,
      fee: BigInt(rawTx.outputs.find((x) => x.address === FEE_ADDRESS)?.value ?? 0),
      balance: parseSummary(utxoDiff(outputs, ownInputs))
    };
  };
}

export function parseSummary(summary: BoxSummary): AssetInfo<BigNumber>[] {
  const assets = summary.tokens.map((x) => ({
    tokenId: x.tokenId,
    amount: BigNumber(String(x.amount))
  }));
  assets.unshift({ tokenId: ERG_TOKEN_ID, amount: BigNumber(String(summary.nanoErgs)) });
  return assets;
}
