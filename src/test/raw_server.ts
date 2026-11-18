import BigInteger = require("../../jsbn/jsbn");
import { SrpServer } from "../srp";

/**
 * SrpServer that uses the secret input directly as the exponent,
 * so the published test vectors can be checked.
 */
export class RawSrpServer extends SrpServer {
  protected deriveExponent(b: BigInteger): BigInteger {
    return b;
  }
}
