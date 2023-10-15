type AssetPriceConversion = {
  rate: number;
  currency: string;
};

export type AssetMetadata = {
  name?: string;
  decimals?: number;
};

export type AssetInfo<AmountType> = {
  metadata?: AssetMetadata;
  conversion?: AssetPriceConversion;
  tokenId: string;
  amount: AmountType;
};

export type VerifiedAsset = Required<Pick<AssetInfo<bigint>, "tokenId" | "metadata">>;
