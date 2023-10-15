import { first, isEmpty, some } from "@fleet-sdk/common";
import { parse } from "@fleet-sdk/serializer";
import BigNumber from "bignumber.js";
import { uniqWith } from "lodash-es";
import { graphQLService } from "./graphqlService";
import { SPECTRUM_ERG_TOKEN_ID, spectrumService } from "./spectrumService";
import { ERG_TOKEN_ID } from "@/constants";
import { get } from "@/utils/networking";

const _1 = BigNumber(1);
const MIN_USD_LIQUIDITY = 1_00;
const COINGECKO_BASE_URI = "https://api.coingecko.com/api/";

const HODLERG3_TOKEN_ID = "cbd75cfe1a4f37f9a22eaee516300e36ea82017073036f07a09c1d2e10277cda";
const HODLERG3_NFT_ID = "6e9c85c4be018b1308ddf034baf1406490e2a9dd406c01591bd6df41e98b6057";
const HODLERG_CONTRACT =
  "100a040204000402040004000502050005d00f04040e2002a195c991b685f1bbf6c84cb192f698ecccc3c707b7293c21d27655ade8d56ed812d601db6308a7d602b27201730000d6038c720202d604b2a5730100d605db63087204d606b27205730200d6078c720602d6089972037207d609c17204d60a7ec1a706d60be4c6a70505d60c7e720b06d60de4c6a70405d60e9d9c720a720c7e99720d720306d60fe4c6a70605d610e4c6a70705d611e4c6a70805d61296830401927209720f93c27204c2a79683030193b27205730300b27201730400938c7206018c72020192720773059683050193e4c672040405720d93e4c672040505720b93e4c672040605720f93e4c672040705721093e4c6720408057211959172087306d1968302017212927e7209069a720a9d9c7e720806720e720cd803d6139d9c7e997207720306720e720cd6147307d615b2a5730800d1968303017212937e7209069a99720a72139d9c72137e7211067e72140696830201937ec17215069d9c72137e7210067e72140693cbc272157309";

type AssetRate = { erg: number; fiat: number };
export type AssetPriceRates = {
  [tokenId: string]: AssetRate;
};

async function getErgRateFromCoingGecko(): Promise<number> {
  const data = await get(new URL("v3/simple/price", COINGECKO_BASE_URI), {
    ids: "ergo",
    vs_currencies: "usd"
  });

  return data.ergo.usd;
}

async function getTokenRatesFromSpectrum(): Promise<Map<string, BigNumber>> {
  const [markets, hiLiqTokens] = await Promise.all([
    spectrumService.getActivePools(),
    assetPricingService.getHighLiquidityTokenIds()
  ]);

  const map = new Map<string, BigNumber>();
  uniqWith(
    markets.filter((p) => p.baseId === SPECTRUM_ERG_TOKEN_ID && hiLiqTokens.includes(p.quoteId)),
    (a, b) => a.quoteId === b.quoteId && a.baseVolume.value <= b.baseVolume.value
  ).map((pool) => map.set(pool.quoteId, _1.div(pool.lastPrice)));

  return map;
}

async function getHodlErg3TokenRate(): Promise<BigNumber | undefined> {
  let boxes = await graphQLService.getBoxes({
    spent: false,
    ergoTrees: [HODLERG_CONTRACT]
  });

  boxes = boxes.filter((b) => some(b.assets) && b.assets[0].tokenId === HODLERG3_NFT_ID);

  if (isEmpty(boxes)) {
    return;
  }

  const box = first(boxes);
  const token = box.assets[1];
  if (!token || !box.additionalRegisters.R4) {
    return;
  }

  const reserve = BigInt(box.value);
  const supply = parse<bigint>(box.additionalRegisters.R4);
  const tokens = BigInt(token.amount);
  const circ = supply - tokens;

  return BigNumber(String(reserve)).div(String(circ));
}

class AssetPricingService {
  #highLiquidityTokenIds?: string[];

  public async getHighLiquidityTokenIds(): Promise<string[]> {
    if (!this.#highLiquidityTokenIds) {
      const stats = await spectrumService.getPoolsStats();

      this.#highLiquidityTokenIds = stats
        .filter((x) => x.lockedX.id === SPECTRUM_ERG_TOKEN_ID && x.tvl.value >= MIN_USD_LIQUIDITY)
        .map((x) => x.lockedY.id);
    }

    return this.#highLiquidityTokenIds;
  }

  public async getTokenRates(): Promise<AssetPriceRates> {
    const [ergFiatRate, tokenRates, hodlergRate] = await Promise.all([
      getErgRateFromCoingGecko(),
      getTokenRatesFromSpectrum(),
      getHodlErg3TokenRate()
    ]);

    const map: AssetPriceRates = { [ERG_TOKEN_ID]: { erg: 1, fiat: ergFiatRate } };

    if (hodlergRate) {
      map[HODLERG3_TOKEN_ID] = {
        erg: hodlergRate.toNumber(),
        fiat: hodlergRate.times(ergFiatRate).toNumber()
      };
    }

    for (const [key, value] of tokenRates) {
      map[key] = {
        erg: value.toNumber(),
        fiat: value.times(ergFiatRate).toNumber()
      };
    }

    return map;
  }
}

export const assetPricingService = new AssetPricingService();
