/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import vows from "vows";
import assert from "assert";
import { SRP, SrpClient, SrpParams } from "../srp";
import { RawSrpServer } from "./raw_server";
import BigInteger = require("../../jsbn/jsbn");

interface Input {
  /** Identity */
  I: Buffer;
  /** Password */
  P: Buffer;
  /** Salt */
  salt: Buffer;
  /** Client private key */
  a: Buffer;
  /** Server private key */
  b: Buffer;
}

interface ExpectedOutput {
  k: Buffer;
  x: Buffer;
  /** Verifier */
  v: Buffer;
  /** Server public key */
  B: Buffer;
  /** Client public key */
  A: Buffer;
  u: Buffer;
  S: Buffer;
  K: Buffer;
  M1: Buffer;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {N, g, I, p, a, A, b, B, s, v, u, S, K} from "./hap_test_data";

const params = SRP.params.hap;

const inputs: Input = {
  I: Buffer.from(I, "ascii"),
  P: Buffer.from(p, "ascii"),
  salt: s.toBuffer(true),
  // a and b are usually random. For testing, we force them to specific values.
  a: a.toBuffer(true),
  b: b.toBuffer(true),
};

const expected: ExpectedOutput = {
  // 'k' encodes the group (N and g), used in SRP-6a
  k: Buffer.from("a9c2e2559bf0ebb53f0cbbf62282906bede7f2182f00678211fbd5bde5b285033a4993503b87397f9be5ec02080fedbc0835587ad039060879b8621e8c3659e0", "hex"),
  // 'x' is derived from the salt and password
  x: Buffer.from("b149ecb0946b0b206d77e73d95deb7c41bd12e86a5e2eea3893d5416591a002ff94bfea384dc0e1c550f7ed4d5a9d2ad1f1526f01c56b5c10577730cc4a4d709", "hex"),
  // 'v' is the SRP verifier
  v: v.toBuffer(true),
  // 'B' is the server's public message
  B: B.toBuffer(true),
  // 'A' is the client's public message
  A: A.toBuffer(true),
  // 'u' combines the two public messages
  u: u.toBuffer(true),
  // 'S' is the shared secret
  S: S.toBuffer(true),
  // 'K' is the shared derived key
  K: K.toBuffer(true),
  // 'M1' is the client's proof that it knows the shared key
  M1: Buffer.from("5f7c14ab57ed0e94fd1d78c6b4dd09ed7e340b7e05d419a9fd760f6b35e523d1310777a1ae1d2826f596f3a85116cc457c7c964d4f44ded5559da818c88b617f", "hex"),
};

function hexequal(a: Buffer, b: Buffer, msg?: string): void {
  assert.strictEqual(a.length, b.length, msg);
  assert.strictEqual(a.toString("hex"), b.toString("hex"), msg);
}

function numequal(a: BigInteger, b: BigInteger, msg?: string): void {
  assert(a.compareTo(b) === 0, msg);
}

function checkVectors(params: SrpParams, inputs: Input, expected: ExpectedOutput, useVerifier = true): void {
  hexequal(inputs.I, Buffer.from("616c696365", "hex"), "I");
  hexequal(SRP.computeVerifier(params, inputs.salt, inputs.I, inputs.P), expected.v, "v");

  const client = new SrpClient(params, inputs.salt, inputs.I, inputs.P, inputs.a, true);
  const server = useVerifier ?
    new RawSrpServer(params, {username: inputs.I, salt: inputs.salt, verifier: expected.v}, inputs.b) :
    new RawSrpServer(params, inputs.salt, inputs.I, inputs.P, inputs.b);

  // @ts-ignore
  numequal(client._k, new BigInteger(expected.k.toString("hex"), 16), "k");
  // @ts-ignore
  numequal(client._x, new BigInteger(expected.x.toString("hex"), 16), "x");
  hexequal(client.computeA(), expected.A);
  hexequal(server.computeB(), expected.B);

  assert.throws(() => client.computeM1(), /incomplete protocol/);
  assert.throws(() => client.computeK(), /incomplete protocol/);
  assert.throws(() => server.checkM1(expected.M1), /incomplete protocol/);
  assert.throws(() => server.computeK(), /incomplete protocol/);
  assert.throws(() => server.computeM2(), /incomplete protocol/);

  client.setB(expected.B);

  // @ts-ignore
  numequal(client._u, new BigInteger(expected.u.toString("hex"), 16));
  // @ts-ignore
  hexequal(client._S, expected.S);
  hexequal(client.computeM1(), expected.M1);
  hexequal(client.computeK(), expected.K);

  server.setA(expected.A);
  // @ts-ignore
  numequal(server._u, new BigInteger(expected.u.toString("hex"), 16));
  // @ts-ignore
  hexequal(server._S, expected.S);
  assert.throws(() => server.checkM1(Buffer.from("notM1")), /client did not use the same password/);
  server.checkM1(expected.M1); // happy, not throwy
  hexequal(server.computeK(), expected.K);
}

vows.describe("HomeKit vectors").addBatch({
  "with verifier": () => checkVectors(params, inputs, expected),
  "with password": () => checkVectors(params, inputs, expected, false),
}).export(module);
