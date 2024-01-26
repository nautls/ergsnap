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
type MempoolTxResponse = { mempool: { transactions: Transaction[] } };
type ConfTxArgs = AddressArgs & { minHeight?: number };

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
  #getMempoolTxs;

  constructor() {
    super("https://gql.ergoplatform.com/");

    this.#getCurrentHeight = this.createOperation<HeaderResponse>(CURRENT_HEIGHT_QUERY);
    this.#getState = this.createOperation<GetStateResponse, AddressArgs>(STATE_QUERY);
    this.#getTokenMetadata = this.createOperation<TokenResponse, TokenArgs>(TOKEN_METADATA_QUERY);
    this.#getConfTxs = this.createOperation<ConfTxResponse, ConfTxArgs>(CONFIRMED_TX_QUERY);
    this.#getMempoolTxs = this.createOperation<MempoolTxResponse, AddressArgs>(MEMPOOL_TX_QUERY);
  }

  public async getCurrentHeight(): Promise<number> {
    const response = await this.#getCurrentHeight();
    return response.data?.blockHeaders[0].height ?? 0;
  }

  public async getConfirmedTransactions(
    address: string,
    minHeight?: number
  ): Promise<Transaction[]> {
    const response = await this.#getConfTxs({ address, minHeight });
    return response.data?.transactions ?? [];
  }

  public async getMempoolTransactions(address: string): Promise<Transaction[]> {
    const response = await this.#getMempoolTxs({ address });
    return response.data?.mempool?.transactions ?? [];
  }

  public async getUnconfirmedTransactions(
    address: string,
    minHeight?: number
  ): Promise<Transaction[]> {
    const response = await this.#getConfTxs({ address, minHeight });
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
const TX_BOX_FIELDS = "address value assets { tokenId amount } index";
const CONFIRMED_TX_QUERY = `query confirmedTransactions($address: String $minHeight: Int  $take: Int $skip: Int) { transactions(address: $address, take: $take, skip: $skip, minHeight: $minHeight) { transactionId timestamp inclusionHeight inputs { box { ${TX_BOX_FIELDS} } } outputs(relevantOnly: true) { ${TX_BOX_FIELDS} } } }`;
const MEMPOOL_TX_QUERY = `query mempoolTransactions($address: String $take: Int $skip: Int) { mempool { transactions(address: $address, take: $take, skip: $skip) { transactionId timestamp inputs { box { ${TX_BOX_FIELDS} } } outputs { ${TX_BOX_FIELDS} } } } }`;
const HEIGHT_FIELDS = "blockHeaders(take: 1) { height }";
const MEMPOOL_FIELDS = "mempool { transactions(address: $address) { transactionId } }";
const STATE_QUERY = `query state($address: String) { ${HEIGHT_FIELDS} ${MEMPOOL_FIELDS} }`;

export const graphQLService = new GraphQLService();
