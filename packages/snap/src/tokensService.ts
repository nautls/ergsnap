import { chunk, some, uniq, uniqBy } from "@fleet-sdk/common";
// import { difference } from "lodash-es";
import { getState, updateState } from "./rpc";
import { createGqlOp } from "./utils";

export interface TokenMetadata {
  tokenId: string;
  name: string;
  decimals: number;
}

type GQLTokensResponse = { tokens: TokenMetadata[] };
type GQLTokensArgs = { tokenIds: string[] };

const GQL_URL = "https://explore.sigmaspace.io/api/graphql";
const TOKENS_QUERY = `query tokens($tokenIds: [String!]!) { tokens(tokenIds: $tokenIds) { tokenId name decimals } }`;

const getGQLTokens = createGqlOp<GQLTokensResponse, GQLTokensArgs>(TOKENS_QUERY, { url: GQL_URL });

export type TokenMetadataMap = Record<string, TokenMetadata>;

export async function getTokensMetadata(tokenIds: string[]): Promise<TokenMetadataMap> {
  const state = await getState();

  const uniqIds = uniq(diff(tokenIds, state.metadata?.map((x) => x.tokenId)));
  const chunks = chunk(uniqIds, 20);
  const gqlResponse = await Promise.all(chunks.map((ids) => getGQLTokens({ tokenIds: ids })));
  const metadata = uniqBy(
    [
      ...gqlResponse.filter((x) => x.data && some(x.data.tokens)).flatMap((x) => x.data!.tokens),
      ...state.metadata
    ],
    (x) => x.tokenId
  );

  state.metadata = metadata;
  updateState(state);

  const map: TokenMetadataMap = {};
  for (const m of metadata) {
    map[m.tokenId] = m;
  }

  return map;
}

function diff<T>(a: T[], b: T[]): T[] {
  return a.filter((x) => !b.includes(x));
}
