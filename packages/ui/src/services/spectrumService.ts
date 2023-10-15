import { get } from "@/utils/networking";

export type SpectrumPool = {
  id: string;
  baseId: string;
  baseSymbol: string;
  quoteId: string;
  quoteSymbol: string;
  lastPrice: number;
  baseVolume: SpectrumPoolVolume;
  quoteVolume: SpectrumPoolVolume;
};

export type SpectrumPoolVolume = {
  value: number;
};

export type SpectrumPoolStat = {
  id: string;
  lockedX: SpectrumLockedValue;
  lockedY: SpectrumLockedValue;
  tvl: { value: number };
};

export type SpectrumLockedValue = {
  id: string;
  amount: number;
  ticker: string;
  decimals: number;
};

// https://api.spectrum.fi/v1/docs
const BASE_URL = "https://api.spectrum.fi";
export const SPECTRUM_ERG_TOKEN_ID =
  "0000000000000000000000000000000000000000000000000000000000000000";

class SpectrumService {
  public async getPoolsStats(): Promise<SpectrumPoolStat[]> {
    return get(new URL("v1/amm/pools/stats", BASE_URL));
  }

  public async getActivePools(): Promise<SpectrumPool[]> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);

    return get(new URL("v1/price-tracking/markets", BASE_URL), {
      from: this._getUtcTimestamp(fromDate),
      to: this._getUtcTimestamp(new Date())
    });
  }

  private _getUtcTimestamp(date: Date) {
    return Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
  }
}

export const spectrumService = new SpectrumService();
