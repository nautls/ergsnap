import { Token, QueryTokensArgs as TokenArgs, Transaction } from "@ergo-graphql/types";
import { ErgoGraphQLProvider } from "@fleet-sdk/blockchain-providers";
import { chunk } from "@fleet-sdk/common";
import { AssetMetadata } from "../types";

type HeaderResponse = { blockHeaders: { height: number }[] };
type CheckMempoolResponse = { mempool: { transactions: { transactionId: string }[] } };
type AddressArgs = { address: string };
type GetStateResponse = HeaderResponse & CheckMempoolResponse;
type TokenResponse = { tokens: Token[] };
type ConfTxResponse = { transactions: Transaction[] };

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
  #getConfTxs;

  constructor() {
    super("https://gql.ergoplatform.com/");

    this.#getCurrentHeight = this.createOperation<HeaderResponse>(CURRENT_HEIGHT_QUERY);
    this.#getState = this.createOperation<GetStateResponse, AddressArgs>(STATE_QUERY);
    this.#getTokenMetadata = this.createOperation<TokenResponse, TokenArgs>(TOKEN_METADATA_QUERY);
    this.#getConfTxs = this.createOperation<ConfTxResponse, AddressArgs>(CONFIRMED_TX_QUERY);
  }

  public async getCurrentHeight(): Promise<number> {
    const response = await this.#getCurrentHeight();
    return response.data?.blockHeaders[0].height ?? 0;
  }

  public async getConfirmedTransactions(address: string): Promise<Transaction[]> {
    const response = await this.#getConfTxs({ address });
    return response.data?.transactions ?? [];
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
const CONFIRMED_TX_QUERY = `query Transactions(
  $address: String
  $take: Int
  $skip: Int
) {
  transactions(address: $address, take: $take, skip: $skip) {
    transactionId
    timestamp
    inclusionHeight
    inputs {
      box {
        address
        value
        assets {
          tokenId
          amount
        }
        index
      }
    }
    outputs(relevantOnly: true) {
      address
      value
      assets {
        tokenId
        amount
      }
      index
    }
  }
}
`;

const HEIGHT_FIELDS = "blockHeaders(take: 1) { height }";
const MEMPOOL_FIELDS = "mempool { transactions(address: $address) { transactionId } }";
const STATE_QUERY = `query state($address: String) { ${HEIGHT_FIELDS} ${MEMPOOL_FIELDS} }`;

export const graphQLService = new GraphQLService();
