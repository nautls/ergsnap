import {
  AddressBalance,
  Box as GraphQLBox,
  Header,
  QueryAddressesArgs,
  QueryBoxesArgs
} from "@ergo-graphql/types";
import { Box, NonMandatoryRegisters, some } from "@fleet-sdk/common";
import { createGqlOp, gql } from "@/utils/networking";

class GraphQLService {
  #getCurrentHeight;
  #getBalance;
  #getBoxes;

  constructor() {
    const op = { url: "https://explore.sigmaspace.io/api/graphql" };

    this.#getCurrentHeight = createGqlOp<{ blockHeaders: Header[] }>(CURRENT_HEIGHT_QUERY, op);
    this.#getBalance = createGqlOp<
      { addresses: { balance: AddressBalance }[] },
      QueryAddressesArgs
    >(BALANCE_QUERY, op);
    this.#getBoxes = createGqlOp<{ boxes: GraphQLBox[] }, QueryBoxesArgs>(BOX_QUERY, op);
  }

  public async getCurrentHeight(): Promise<number | undefined> {
    const response = await this.#getCurrentHeight();
    return response.data?.blockHeaders[0].height;
  }

  public async getBalance(addresses: string[]) {
    const response = await this.#getBalance({ addresses });
    return response.data?.addresses.flatMap((x) => x.balance) || [];
  }

  public async *yeldBoxes(args: QueryBoxesArgs) {
    const take = 50;

    let len = 0;
    let skip = 0;

    do {
      const chunk = await this.getBoxes({ ...args, take, skip });
      skip += take;
      len = chunk.length;

      if (some(chunk)) {
        yield chunk;
      }
    } while (len === take);
  }

  public async getBoxes(args: QueryBoxesArgs): Promise<Box<string>[]> {
    const response = await this.#getBoxes(args);

    return (
      response.data?.boxes.map((box) => ({
        ...box,
        additionalRegisters: box.additionalRegisters as NonMandatoryRegisters
      })) || []
    );
  }
}

const CURRENT_HEIGHT_QUERY = gql`
  query height {
    blockHeaders(take: 1) {
      height
    }
  }
`;

const BALANCE_QUERY = gql`
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

const BOX_QUERY = gql`
  query Boxes($ergoTrees: [String!], $spent: Boolean!, $skip: Int, $take: Int) {
    boxes(ergoTrees: $ergoTrees, spent: $spent, skip: $skip, take: $take) {
      boxId
      transactionId
      value
      creationHeight
      index
      ergoTree
      additionalRegisters
      assets {
        tokenId
        amount
      }
    }
  }
`;

export const graphQLService = new GraphQLService();
