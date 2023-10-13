import { MetaMaskInpageProvider } from "@metamask/providers";
import { SNAP_ORIGIN } from "../params";
import { GetSnapsResponse, Snap } from "../types";

/**
 * Get the installed snaps in MetaMask.
 *
 * @param provider - The MetaMask inpage provider.
 * @returns The snaps installed in MetaMask.
 */
export async function getSnaps(
  provider?: MetaMaskInpageProvider,
): Promise<GetSnapsResponse> {
  return (await (provider ?? window.ethereum).request({
    method: "wallet_getSnaps",
  })) as GetSnapsResponse;
}

/**
 * Connect a snap to MetaMask.
 *
 * @param snapId - The ID of the snap.
 * @param params - The params to pass with the snap to connect.
 */
export async function connectSnap(
  snapId: string = SNAP_ORIGIN,
  params: Record<"version" | string, unknown> = {},
) {
  await window.ethereum.request({
    method: "wallet_requestSnaps",
    params: {
      [snapId]: params,
    },
  });
}

/**
 * Get the snap from MetaMask.
 *
 * @param version - The version of the snap to install (optional).
 * @returns The snap object returned by the extension.
 */
export async function getSnap(version?: string): Promise<Snap | undefined> {
  try {
    const snaps = await getSnaps();

    return Object.values(snaps).find(
      (snap) =>
        snap.id === SNAP_ORIGIN && (!version || snap.version === version),
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log("Failed to obtain installed snap", e);
    return undefined;
  }
}

export async function getAddress(): Promise<string> {
  return (await window.ethereum.request({
    method: "wallet_invokeSnap",
    params: { snapId: SNAP_ORIGIN, request: { method: "get_address" } },
  })) as string;
}

export const isLocalSnap = (snapId: string) => snapId.startsWith("local:");
