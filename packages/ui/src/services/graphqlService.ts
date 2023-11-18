import { AddressBalance, QueryAddressesArgs as AddressesArgs, Header } from "@ergo-graphql/types";
import { ErgoGraphQLProvider } from "@fleet-sdk/blockchain-providers";

type HeaderResponse = { blockHeaders: Header[] };
type BalanceResponse = { addresses: { balance: AddressBalance }[] };

class GraphQLService extends ErgoGraphQLProvider {
  #getCurrentHeight;
  #getBalance;

  constructor() {
    super("https://explore.sigmaspace.io/api/graphql");

    this.#getCurrentHeight = this.createOperation<HeaderResponse>(CURRENT_HEIGHT_QUERY);
    this.#getBalance = this.createOperation<BalanceResponse, AddressesArgs>(BALANCE_QUERY);
  }

  public async getCurrentHeight(): Promise<number | undefined> {
    const response = await this.#getCurrentHeight();
    return response.data?.blockHeaders[0].height;
  }

  public async getBalance(addresses: string[]) {
    const response = await this.#getBalance({ addresses });
    return response.data?.addresses.flatMap((x) => x.balance) || [];
  }
}

const CURRENT_HEIGHT_QUERY = /* GraphQL */ `
  query height {
    blockHeaders(take: 1) {
      height
    }
  }
`;

const BALANCE_QUERY = /* GraphQL */ `
  query balances($addresses: [String!]!) {
    addresses(addresses: $addresses) {
      balance {
        nanoErgs
        assets {
          tokenId
          amount
          decimals
          name
        }
      }
    }
  }
`;

export const graphQLService = new GraphQLService();
