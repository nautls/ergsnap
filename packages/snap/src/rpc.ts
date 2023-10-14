import { hex } from "@fleet-sdk/crypto";
import { ErgoHDKey } from "@fleet-sdk/wallet";
import { HDKey } from "@scure/bip32";

const PATH = ["m", "44'", "429'", "0'"];
const CRYPTO_CURVE = "secp256k1";
const VERSIONS = { private: 0x0488ade4, public: 0x0488b21e };

export async function getExPrivateKey(): Promise<ErgoHDKey> {
  const response = await snap.request({
    method: "snap_getBip32Entropy",
    params: {
      path: PATH,
      curve: CRYPTO_CURVE
    }
  });

  const key = new HDKey({
    versions: VERSIONS,
    chainCode: hex.decode(trimHexPrefix(response.chainCode)),
    depth: response.depth,
    index: response.index,
    parentFingerprint: response.parentFingerprint,
    privateKey: response.privateKey ? hex.decode(trimHexPrefix(response.privateKey)) : undefined
  });

  return ErgoHDKey.fromExtendedKey(key.derive("m/0").privateExtendedKey);
}

export async function getAddress(): Promise<string> {
  const key = await getExPrivateKey();
  return key.deriveChild(0).address.encode();
}

function trimHexPrefix(key: string) {
  return key.startsWith("0x") ? key.substring(2) : key;
}
