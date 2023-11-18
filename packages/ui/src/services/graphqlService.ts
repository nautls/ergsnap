import { Header } from "@ergo-graphql/types";
import { ErgoGraphQLProvider } from "@fleet-sdk/blockchain-providers";

type HeaderResponse = { blockHeaders: Header[] };

class GraphQLService extends ErgoGraphQLProvider {
  #getCurrentHeight;

  constructor() {
    super("https://explore.sigmaspace.io/api/graphql");

    this.#getCurrentHeight = this.createOperation<HeaderResponse>(CURRENT_HEIGHT_QUERY);
  }

  public async getCurrentHeight(): Promise<number | undefined> {
    const response = await this.#getCurrentHeight();
    return response.data?.blockHeaders[0].height;
  }
}

const CURRENT_HEIGHT_QUERY = `query height {  blockHeaders(take: 1) { height } }`;

export const graphQLService = new GraphQLService();
