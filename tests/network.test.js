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
