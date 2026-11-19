import assert from "node:assert/strict";
import test from "node:test";
import { ensureNetwork, genesis } from "../src/network.js";

const owner = "0x0000000000000000000000000000000000000001";
function provider(blockHash, selected = owner) {
  return {
    async request({ method }) {
      if (method === "eth_chainId") return "0x107d";
      if (method === "eth_getBlockByNumber") return { hash: blockHash };
      if (method === "eth_accounts") return [selected];
      throw new Error(`Unexpected wallet request ${method}`);
    },
  };
}

test("wallet check returns after matching both chain ID and genesis", async () => {
  await ensureNetwork(provider(genesis), owner);
});

test("wallet check rejects a different genesis on the same chain ID", async () => {
  await assert.rejects(ensureNetwork(provider("0xdead"), owner), /Phase 2/);
});

test("wallet check rejects a different selected account", async () => {
  await assert.rejects(ensureNetwork(provider(genesis, "0x0000000000000000000000000000000000000002"), owner), /changed/);
});

test("wallet payload uses verified gas and leaves nonce and fee type to the wallet", async () => {
  const { walletTransactionRequest } = await import("../src/network.js");
  const from = owner, to = "0x0000000000000000000000000000000000000002";
  const draft = { from, to, data: "0x1234", value: "0x1", nonce: "0x5", type: "0x0", gasPrice: "0xff", gas: "0x5" };
  const result = await walletTransactionRequest(draft, async (estimate) => {
    assert.deepEqual(estimate, { from, to, data: "0x1234", value: 1n });
    return 100n;
  });
  assert.deepEqual(result, { from, to, data: "0x1234", value: "0x1", gas: "0x78" });
  await assert.rejects(walletTransactionRequest(draft, async () => { throw new Error("RPC estimate reverted"); }), /estimate reverted/);
});

test("wallet diagnostics keep the nested RPC reason and omit long calldata", async () => {
  const { walletErrorDetails } = await import("../src/network.js");
  const details = walletErrorDetails({
    code: -32603, message: "Internal error",
    data: { originalError: { code: -32000, message: "Fee cap below base fee 0x" + "a".repeat(100) } },
  });
  assert.match(details, /\[-32603\] Internal error/);
  assert.match(details, /\[-32000\] Fee cap below base fee \[calldata omitted\]/);
});
