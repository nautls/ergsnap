import type { MetaMaskInpageProvider as MMProvider } from "@metamask/providers";
import type { GetSnapsResponse, Snap } from "../types";

export function isMetamaskPresent(): boolean {
  return window.ethereum?.isMetaMask ?? false;
}

export function isMetamaskConnected(): boolean {
  return window.ethereum?.isConnected() ?? false;
}

export function getProvider(): MMProvider {
  if (window.ethereum) {
    return window.ethereum;
  }

  throw new Error("Metamask provider is not available.");
}

/**
 * Get the installed snaps in MetaMask.
 *
 * @param provider - The MetaMask inpage provider.
 * @returns The snaps installed in MetaMask.
 */
export async function getSnaps(): Promise<GetSnapsResponse> {
  return (await getProvider().request({
    method: "wallet_getSnaps"
  })) as GetSnapsResponse;
}

/**
 * Connect a snap to MetaMask.
 *
 * @param snapId - The ID of the snap.
 * @param params - The params to pass with the snap to connect.
 */
export async function connectSnap(
  snapId: string,
  params: Record<"version" | string, unknown> = {}
) {
  await getProvider().request({
    method: "wallet_requestSnaps",
    params: {
      [snapId]: params
    }
  });
}

/**
 * Get the snap from MetaMask.
 *
 * @param version - The version of the snap to install (optional).
 * @returns The snap object returned by the extension.
 */
export async function getSnap(snapId: string, version?: string): Promise<Snap | undefined> {
  try {
    const snaps = await getSnaps();
    return Object.values(snaps).find(
      (snap) => snap.id === snapId && (!version || snap.version === version)
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to obtain installed snap", e);
    return undefined;
  }
}

export const isLocalSnap = (snapId: string) => snapId.startsWith("local:");
