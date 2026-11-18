// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import vows from "vows";
import assert from "assert";
import { SRP, SrpClient, SrpServer } from "../srp";

const params = SRP.params.hap;
const username = "Pair-Setup";
const salt = Buffer.from("0123456789abcdef", "hex");
const pincode = "031-45-154";

function completeExchange(server: SrpServer, client: SrpClient): void {
  server.setA(client.computeA());
  client.setB(server.computeB());
  server.checkM1(client.computeM1());
  client.checkM2(server.computeM2());
  assert.strictEqual(client.computeK().toString("hex"), server.computeK().toString("hex"));
}

vows.describe("srp.js API").addBatch({
  "genKey": {
    "with a callback and no length returns 32 bytes": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      topic(this: any): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (SRP.genKey as any)(this.callback);
      },
      "32 bytes"(err: Error | null, key: Buffer): void {
        assert.ifError(err);
        assert(Buffer.isBuffer(key));
        assert.strictEqual(key.length, 32);
      },
    },

    "as a promise honours the length": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      topic(this: any): void {
        SRP.genKey(48).then(key => this.callback(null, key), err => this.callback(err));
      },
      "48 bytes"(err: Error | null, key: Buffer): void {
        assert.ifError(err);
        assert.strictEqual(key.length, 48);
      },
    },
  },

  "SrpServer from a HAP identity": {
    topic(): Buffer[] {
      return [Buffer.alloc(32, 1), Buffer.alloc(32, 2)];
    },

    "with a string password completes an exchange"([a, b]: Buffer[]): void {
      const server = new SrpServer(params, {username, salt, password: pincode}, b);
      const client = new SrpClient(params, salt, Buffer.from(username), Buffer.from(pincode), a, true);
      completeExchange(server, client);
    },

    "with a Buffer password matches the verifier form"([, b]: Buffer[]): void {
      const verifier = SRP.computeVerifier(params, salt, Buffer.from(username), Buffer.from(pincode));
      const fromPassword = new SrpServer(params, {username: Buffer.from(username), salt, password: Buffer.from(pincode)}, b);
      const fromVerifier = new SrpServer(params, {username, salt, verifier}, b);
      assert.strictEqual(fromPassword.computeB().toString("hex"), fromVerifier.computeB().toString("hex"));
    },

    "matches the positional password form"([, b]: Buffer[]): void {
      const fromIdentity = new SrpServer(params, {username, salt, password: pincode}, b);
      const positional = new SrpServer(params, salt, Buffer.from(username), Buffer.from(pincode), b);
      assert.strictEqual(fromIdentity.computeB().toString("hex"), positional.computeB().toString("hex"));
    },

    "rejects a wrong pincode"([a, b]: Buffer[]): void {
      const server = new SrpServer(params, {username, salt, password: pincode}, b);
      const client = new SrpClient(params, salt, Buffer.from(username), Buffer.from("000-00-000"), a, true);
      server.setA(client.computeA());
      client.setB(server.computeB());
      assert.throws(() => server.checkM1(client.computeM1()), /client did not use the same password/);
    },

    "uses a fresh B for each secret"([, b]: Buffer[]): void {
      const B1 = new SrpServer(params, {username, salt, password: pincode}, b).computeB();
      const B2 = new SrpServer(params, {username, salt, password: pincode}, Buffer.alloc(32, 3)).computeB();
      assert.notStrictEqual(B1.toString("hex"), B2.toString("hex"));
    },
  },

  "argument checks": {
    "server rejects a non-Buffer secret"(): void {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assert.throws(() => new SrpServer(params, {username, salt, password: pincode}, "secret" as any), /secret2 must be a buffer/);
    },

    "server rejects an identity without password or verifier"(): void {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assert.throws(() => new SrpServer(params, {username, salt} as any, Buffer.alloc(32)), /requires a password or verifier/);
    },

    "server rejects a non-Buffer salt"(): void {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assert.throws(() => new SrpServer(params, {username, salt: "salt", password: pincode} as any, Buffer.alloc(32)));
    },

    "client rejects a non-Buffer password"(): void {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assert.throws(() => new SrpClient(params, salt, Buffer.from(username), pincode as any, Buffer.alloc(32), true), /must be a buffer/);
    },
  },

  "short client key": {
    "warns but still works"(): void {
      const warnings: unknown[] = [];
      const warn = console.warn;
      console.warn = (...args: unknown[]): void => {
        warnings.push(args);
      };
      try {
        const client = new SrpClient(params, salt, Buffer.from(username), Buffer.from(pincode), Buffer.alloc(16, 1), true);
        const server = new SrpServer(params, {username, salt, password: pincode}, Buffer.alloc(32, 2));
        completeExchange(server, client);
      } finally {
        console.warn = warn;
      }
      assert.strictEqual(warnings.length, 1);
    },
  },
}).export(module);
