import { Token, QueryTokensArgs as TokenArgs } from "@ergo-graphql/types";
import { ErgoGraphQLProvider } from "@fleet-sdk/blockchain-providers";
import { chunk } from "@fleet-sdk/common";
import { AssetMetadata } from "../types";

type HeaderResponse = { blockHeaders: { height: number }[] };
type CheckMempoolResponse = { mempool: { transactions: { transactionId: string }[] } };
type CheckMempoolArgs = { address: string };
type GetStateResponse = HeaderResponse & CheckMempoolResponse;
type TokenResponse = { tokens: Token[] };

type StatusCheck = {
  height: number;
  mempoolTransactionIds?: string[];
};

export type GqlAssetMetadata = {
  tokenId: string;
} & AssetMetadata;

class GraphQLService extends ErgoGraphQLProvider {
  #getCurrentHeight;
  #getState;
  #getTokenMetadata;

  constructor() {
    super("https://explore.sigmaspace.io/api/graphql");

    this.#getCurrentHeight = this.createOperation<HeaderResponse>(CURRENT_HEIGHT_QUERY);
    this.#getState = this.createOperation<GetStateResponse, CheckMempoolArgs>(STATE_QUERY);
    this.#getTokenMetadata = this.createOperation<TokenResponse, TokenArgs>(TOKEN_METADATA_QUERY);
  }

  public async getCurrentHeight(): Promise<number> {
    const response = await this.#getCurrentHeight();
    return response.data?.blockHeaders[0].height ?? 0;
  }

  public async getState(address: string): Promise<StatusCheck> {
    const response = await this.#getState({ address });

    return {
      height: response.data?.blockHeaders[0].height ?? 0,
      mempoolTransactionIds: response.data?.mempool.transactions.map((x) => x.transactionId)
    };
  }

  public async *streamMetadata(tokenIds: string[]): AsyncGenerator<GqlAssetMetadata[]> {
    const chunks = chunk(tokenIds, 20);
    for (const tokenIds of chunks) {
      const response = await this.#getTokenMetadata({ tokenIds });

      if (response.data?.tokens) {
        yield response.data.tokens as GqlAssetMetadata[];
      }
    }
  }
}

const CURRENT_HEIGHT_QUERY = `query height { blockHeaders(take: 1) { height } }`;
const TOKEN_METADATA_QUERY = `query tokens($tokenIds: [String!]!) { tokens(tokenIds: $tokenIds) { tokenId name decimals } }`;

const HEIGHT_FIELDS = "blockHeaders(take: 1) { height }";
const MEMPOOL_FIELDS = "mempool { transactions(address: $address) { transactionId } }";
const STATE_QUERY = `query state($address: String) { ${HEIGHT_FIELDS} ${MEMPOOL_FIELDS} }`;

export const graphQLService = new GraphQLService();
