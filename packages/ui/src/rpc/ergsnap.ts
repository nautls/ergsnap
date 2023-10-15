import { connectSnap, getProvider, getSnap } from ".";
import { EIP12UnsignedTransaction, SignedTransaction } from "@fleet-sdk/common";

export const SNAP_ORIGIN = import.meta.env.PROD
  ? "npm:@nautls/ergsnap"
  : "local:http://localhost:8080";

export const ergSnap = {
  async getVersion() {
    return (await getSnap(SNAP_ORIGIN))?.version;
  },

  async connect() {
    try {
      await connectSnap(SNAP_ORIGIN);
      return true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      return false;
    }
  },

  async getAddress() {
    return (await getProvider().request({
      method: "wallet_invokeSnap",
      params: { snapId: SNAP_ORIGIN, request: { method: "get_address" } }
    })) as string;
  },

  async signTx(unsignedTx: EIP12UnsignedTransaction) {
    return (await getProvider().request({
      method: "wallet_invokeSnap",
      params: { snapId: SNAP_ORIGIN, request: { method: "sign_tx", params: { tx: unsignedTx } } }
    })) as SignedTransaction;
  }
};
