import { EIP12UnsignedTransaction } from "@fleet-sdk/common";
import { getAddress, signTransaction } from "./rpc";

interface GetAddressRequest {
  method: "get_address";
}

interface SignTxRequest {
  method: "sign_tx";
  params: {
    tx: EIP12UnsignedTransaction;
  };
}

interface RpcRequest {
  origin: string;
  request: GetAddressRequest | SignTxRequest;
}

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest = async ({ request }: RpcRequest) => {
  switch (request.method) {
    // case "hello": {
    //   const test = await getAddress();
    //   return await snap.request({
    //     method: "snap_dialog",
    //     params: {
    //       type: "confirmation",
    //       content: panel([
    //         text(`Hello, **${origin}**!ss`),
    //         text("This custom confirmation is just for display purposes."),
    //         text("But you can edit the snap source code to make it do something, if you want to!"),
    //         text("test"),
    //         text(test)
    //       ])
    //     }
    //   });
    // }
    case "get_address":
      return getAddress();
    case "sign_tx": {
      const tx = request.params.tx;
      if (!tx) {
        throw new Error("Unsigned transaction is not present.");
      }

      return await signTransaction(tx);
    }
    default:
      throw new Error("Method not found.");
  }
};
