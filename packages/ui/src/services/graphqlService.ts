import { ErgoGraphQLProvider } from "@fleet-sdk/blockchain-providers";

type HeaderResponse = { blockHeaders: { height: number }[] };
type CheckMempoolResponse = { mempool: { transactions: { transactionId: string }[] } };
type CheckMempoolArgs = { address: string };
type GetStateResponse = HeaderResponse & CheckMempoolResponse;

type StatusCheck = {
  height: number;
  mempoolTransactionIds?: string[];
};

class GraphQLService extends ErgoGraphQLProvider {
  #getCurrentHeight;
  #getState;

  constructor() {
    super("https://explore.sigmaspace.io/api/graphql");

    this.#getCurrentHeight = this.createOperation<HeaderResponse>(CURRENT_HEIGHT_QUERY);
    this.#getState = this.createOperation<GetStateResponse, CheckMempoolArgs>(STATE_QUERY);
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
}

const CURRENT_HEIGHT_QUERY = `query height { blockHeaders(take: 1) { height } }`;

const HEIGHT_FIELDS = "blockHeaders(take: 1) { height }";
const MEMPOOL_FIELDS = "mempool { transactions(address: $address) { transactionId } }";
const STATE_QUERY = `query state($address: String) { ${HEIGHT_FIELDS} ${MEMPOOL_FIELDS} }`;

export const graphQLService = new GraphQLService();
