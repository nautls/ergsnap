// Implementation inspired in https://github.com/coinbarn/ergo-ts/blob/master/src/ergoSchnorr.ts
import { concatBytes } from "@fleet-sdk/common";
import { blake2b256, hex, randomBytes } from "@fleet-sdk/crypto";
import { schnorr, secp256k1 } from "@noble/curves/secp256k1";

const { ProjectivePoint: ECPoint, CURVE } = secp256k1;
const { numberToBytesBE, bytesToNumberBE, mod } = schnorr.utils;

export function sign(message: Uint8Array, secretKey: Uint8Array) {
  const g = ECPoint.BASE;

  const sk = bytesToNumberBE(secretKey);
  const y = mod(bytesToNumberBE(randomBytes(32)), CURVE.n);

  const w = g.multiply(y).toRawBytes();
  const pk = g.multiply(sk).toRawBytes();

  const commitment = genCommitment(pk, w);
  const s = concatBytes(commitment, message);
  const c = numHash(s);
  const z = mod(sk * c + y, CURVE.n);

  const cb = numberToBytesBE(c, 24);
  const zb = numberToBytesBE(z, 32);

  return concatBytes(cb, zb);
}

export function verify(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
) {
  if (signature.length !== 56) {
    return false;
  }

  const g = ECPoint.BASE;
  const c = bytesToNumberBE(signature.slice(0, 24));
  const z = bytesToNumberBE(signature.slice(24, 56));
  const pk = ECPoint.fromHex(publicKey);

  const t = pk.multiply(CURVE.n - c);
  const w = g.multiply(z).add(t);

  const commitment = genCommitment(publicKey, w.toRawBytes());
  const s = concatBytes(commitment, message);

  return numHash(s) === c;
}

function numHash(message: Uint8Array) {
  return bytesToNumberBE(blake2b256(message).slice(0, 24));
}

const COMMITMENT_PREFIX = hex.decode("010027100108cd");
const COMMITMENT_POSTFIX = hex.decode("73000021");

function genCommitment(pk: Uint8Array, w: Uint8Array) {
  return concatBytes(COMMITMENT_PREFIX, pk, COMMITMENT_POSTFIX, w);
}
