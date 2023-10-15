import { Box, BoxCandidate, EIP12UnsignedTransaction, SignedTransaction } from "@fleet-sdk/common";
import { blake2b256, hex } from "@fleet-sdk/crypto";
import { serializeBox, serializeTransaction } from "@fleet-sdk/serializer";
import { ErgoHDKey } from "@fleet-sdk/wallet";
import { sign } from "./ergoSchnorr";

export function signTx(unsignedTx: EIP12UnsignedTransaction, key: ErgoHDKey): SignedTransaction {
  if (!key.privateKey) {
    throw new Error("Private key is not present");
  }

  const txBytes = serializeTransaction(unsignedTx).toBytes();
  const proofHex = hex.encode(sign(txBytes, key.privateKey));
  const txId = hex.encode(blake2b256(txBytes));

  return {
    id: txId,
    inputs: unsignedTx.inputs.map((x) => ({
      boxId: x.boxId,
      spendingProof: { extension: x.extension, proofBytes: proofHex }
    })),
    dataInputs: unsignedTx.dataInputs.map((x) => ({ boxId: x.boxId })),
    outputs: unsignedTx.outputs.map(mapOutput(txId))
  };
}
function mapOutput(txId: string) {
  return (x: BoxCandidate<string>, i: number) => {
    const box: Box<string> = {
      boxId: "",
      ...x,
      transactionId: txId,
      index: i
    };
    box.boxId = hex.encode(blake2b256(serializeBox(box).toBytes()));

    return box;
  };
}
