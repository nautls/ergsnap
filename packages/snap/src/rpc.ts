import {
  Amount,
  BoxCandidate,
  decimalize,
  EIP12UnsignedTransaction,
  some,
  TokenAmount,
  uniq,
  utxoDiff,
  utxoSum
} from "@fleet-sdk/common";
import { ErgoAddress } from "@fleet-sdk/core";
import { hex } from "@fleet-sdk/crypto";
import { ErgoHDKey } from "@fleet-sdk/wallet";
import type { Json } from "@metamask/snaps-types";
import { copyable, divider, heading, panel, text } from "@metamask/snaps-ui";
import { HDKey } from "@scure/bip32";
import { signTx } from "./ergo/prover";
import { getTokensMetadata, TokenMetadata, TokenMetadataMap } from "./tokensService";
import { shortenString } from "./utils";

const PATH = ["m", "44'", "429'", "0'"];
const CRYPTO_CURVE = "secp256k1";
const VERSIONS = { private: 0x0488ade4, public: 0x0488b21e };
const ERG_DECIMALS = 9;

interface State {
  metadata: TokenMetadata[];
}

export async function getState(): Promise<State> {
  const state = (await snap.request({
    method: "snap_manageState",
    params: { operation: "get" }
  })) as unknown as State;

  return state ?? { metadata: [] };
}

export async function updateState(state: State): Promise<void> {
  snap.request({
    method: "snap_manageState",
    params: { operation: "update", newState: state as unknown as Record<string, Json> }
  });
}

export async function getPrivateKey(): Promise<ErgoHDKey> {
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
  const key = await getPrivateKey();
  return key.deriveChild(0).address.encode();
}

export async function signTransaction(unsignedTx: EIP12UnsignedTransaction) {
  const confirmed = await confirmTransaction(unsignedTx);
  if (!confirmed) {
    throw new Error("Transaction rejected by the user");
  }

  const sk = await getPrivateKey();
  return signTx(unsignedTx, sk.deriveChild(0));
}

async function confirmTransaction(unsignedTx: EIP12UnsignedTransaction) {
  const tokenIds = uniq([
    ...unsignedTx.inputs.flatMap((x) => x.assets.map((t) => t.tokenId)),
    ...unsignedTx.outputs.flatMap((x) => x.assets.map((t) => t.tokenId))
  ]);

  const metadata = await getTokensMetadata(tokenIds);
  const pk = ErgoAddress.fromBase58(await getAddress()).ergoTree;
  const burning = utxoDiff(utxoSum(unsignedTx.inputs), utxoSum(unsignedTx.outputs));

  if (some(burning.tokens)) {
    const confirmed = await snap.request({
      method: "snap_dialog",
      params: {
        type: "confirmation",
        content: panel([
          heading("Transaction Review"),
          text(
            "The transaction you are about to review is attempting to burn the following tokens, please proceed only if you know exactly what you are doing."
          ),
          divider(),
          ...burning.tokens.map(mapToken(metadata))
        ])
      }
    });

    if (!confirmed) {
      throw new Error("Transaction rejected by the user");
    }
  }

  const burningNodes = some(burning.tokens)
    ? [
        panel([
          heading("⚠️ Burning ⚠️"),
          text("Keep mind that asset burning operations are **irreversible**."),
          ...burning.tokens.map(mapToken(metadata)),
          divider()
        ])
      ]
    : [];
  const outputsNodes = unsignedTx.outputs.map((x, i, a) =>
    mapOutput(x, i < a.length - 1, pk, metadata)
  );
  const uiNodes = panel([
    heading("Transaction Review"),
    text("Please review your transaction before you approve it."),
    divider(),

    ...burningNodes,
    ...outputsNodes
  ]);

  return (await snap.request({
    method: "snap_dialog",
    params: {
      type: "confirmation",
      content: uiNodes
    }
  })) as boolean;
}

function mapOutput(
  box: BoxCandidate<string>,
  includeDivider: boolean,
  ownPk: string,
  metadata: TokenMetadataMap
) {
  const tokens = box.assets.map(mapToken(metadata));
  const receiving = ownPk === box.ergoTree;
  return panel([
    heading(receiving ? "Receiving" : "Sending"),
    text(`**${decimalize(box.value, ERG_DECIMALS)}** ERG`),
    ...tokens,
    text(receiving ? "To **(your address)**" : "**To**"),
    copyable(ErgoAddress.fromErgoTree(box.ergoTree).encode()),
    ...(includeDivider ? [divider()] : [])
  ]);
}

function mapToken(metadata: TokenMetadataMap) {
  return (token: TokenAmount<Amount>) => {
    const meta = metadata[token.tokenId];
    const name = meta?.name ? meta.name : shortenString(token.tokenId, 20);
    const amount = decimalize(token.amount, meta.decimals ?? 0);

    return text(`**${amount}** ${name}`);
  };
}

function trimHexPrefix(key: string) {
  return key.startsWith("0x") ? key.substring(2) : key;
}
