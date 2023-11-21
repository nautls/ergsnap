export type AssetMetadata = {
  name?: string;
  decimals?: number;
};

export type AssetInfo<AmountType> = {
  tokenId: string;
  amount: AmountType;
};
