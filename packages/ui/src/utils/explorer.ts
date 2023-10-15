import { ERG_TOKEN_ID, EXPLORER_URL } from "@/constants";

export function tokenUrlFor(tokenId?: string) {
  if (!tokenId || tokenId === ERG_TOKEN_ID) {
    return;
  }

  return new URL(`token/${tokenId}`, EXPLORER_URL).href;
}

export function addressUrlFor(address?: string) {
  if (!address) {
    return;
  }

  return new URL(`addresses/${address}`, EXPLORER_URL).href;
}
