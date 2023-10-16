import { decimalize, isUndefined } from "@fleet-sdk/common";
import { BigNumber } from "bignumber.js";
import { AssetInfo } from "../types";
import { shorten } from "./string";

const BIG_NUMBER_IN_SHORT = Intl.NumberFormat("en", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 2
});

const SHORT_NUMBER_THRESHOLD = 1_000_000;

type BigN = BigNumber | Readonly<BigNumber>;

export function displayAmount(asset?: AssetInfo<bigint | BigN>): string {
  if (!asset) return "";

  const decimals = asset.metadata?.decimals ?? 0;
  return typeof asset.amount === "bigint"
    ? decimalize(asset.amount, { decimals, thousandMark: "," })
    : formatBigNumber(decimalizeBigNumber(asset.amount, decimals), decimals);
}

export function displayName(asset?: AssetInfo<unknown>, maxLen = 20): string {
  if (!asset) return "";
  return shorten(asset.metadata?.name || asset.tokenId, maxLen);
}

export function formatBigNumber(number?: BigN, decimals?: number): string {
  if (isUndefined(number)) {
    return "0";
  }

  if (number.isGreaterThanOrEqualTo(SHORT_NUMBER_THRESHOLD)) {
    return BIG_NUMBER_IN_SHORT.format(number.toNumber());
  }

  return number.decimalPlaces(decimals || 0, BigNumber.ROUND_DOWN).toFormat({
    groupSeparator: ",",
    groupSize: 3,
    decimalSeparator: "."
  });
}

export function undecimalizeBigNumber(number: BigN, decimals: number) {
  return number.decimalPlaces(decimals).shiftedBy(decimals);
}

export function decimalizeBigNumber(number: BigN, decimals?: number): BigN {
  if (!decimals) {
    return number;
  }

  return number.decimalPlaces(decimals).shiftedBy(decimals * -1);
}

export const ASSET_ICONS: { [tokenId: string]: string } = {
  ["ERG"]: "ergo.png",
  ["003bd19d0187117f130b62e1bcab0939929ff5c7709f843c5c4dd158949285d0"]: "sigrsv.svg",
  ["03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04"]: "sigusd.svg",
  ["36aba4b4a97b65be491cf9f5ca57b5408b0da8d0194f30ec8330d1e8946161c1"]: "erdoge.svg",
  ["fbbaac7337d051c10fc3da0ccb864f4d32d40027551e1c3ea3ce361f39b91e40"]: "kushti.svg",
  ["0cd8c9f416e5b1ca9f986a7f10a84191dfb85941619e49e53c0dc30ebf83324b"]: "comet.png",
  ["472c3d4ecaa08fb7392ff041ee2e6af75f4a558810a74b28600549d5392810e8"]: "neta.svg",
  ["d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de413"]: "ergopad.svg",
  ["1fd6e032e8476c4aa54c18c1a308dce83940e8f4a28f576440513ed7326ad489"]: "paideia.svg",
  ["00b1e236b60b95c2c6f8007a9d89bc460fc9e78f98b09faec9449007b40bccf3"]: "egio.svg",
  ["007fd64d1ee54d78dd269c8930a38286caa28d3f29d27cadcb796418ab15c283"]: "exle.svg",
  ["02f31739e2e4937bb9afb552943753d1e3e9cdd1a5e5661949cb0cef93f907ea"]: "terahertz.svg",
  ["e8b20745ee9d18817305f32eb21015831a48f02d40980de6e849f886dca7f807"]: "flux.svg",
  ["00bd762484086cf560d3127eb53f0769d76244d9737636b2699d55c56cd470bf"]: "epos.svg",
  ["18c938e1924fc3eadc266e75ec02d81fe73b56e4e9f4e268dffffcb30387c42d"]: "aht.svg",
  ["3405d8f709a19479839597f9a22a7553bdfc1a590a427572787d7c44a88b6386"]: "love.svg",
  ["4c8ac00a28b198219042af9c03937eecb422b34490d55537366dc9245e85d4e1"]: "woodennickels.svg",
  ["9a06d9e545a41fd51eeffc5e20d818073bf820c635e2a9d922269913e0de369d"]: "spf.svg",
  ["089990451bb430f05a85f4ef3bcb6ebf852b3d6ee68d86d78658b9ccef20074f"]: "quacks.svg",
  ["cbd75cfe1a4f37f9a22eaee516300e36ea82017073036f07a09c1d2e10277cda"]: "empty.svg"
};
