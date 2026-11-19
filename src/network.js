import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { formatEther, parseEventLogs } from "viem";

export const rpc = "https://rpc-bradbury.genlayer.com";
export const walletRpc = "https://rpc.testnet-chain.genlayer.com";
export const explorer = "https://scan.bradbury.genlayer.com";
export const chainExplorer = "https://scan.testnet-chain.genlayer.com";
export const genesis = "0x17d89764d4f4f963158fc4c5e8f2cb670c2837740b35f37081c12860c3df97e4";
export const addressPattern = /^0x[a-f0-9]{40}$/i;
export const hashPattern = /^0x[a-f0-9]{64}$/i;
export const publicClient = createClient({ chain: testnetBradbury, endpoint: rpc });

export async function connectWallet(provider) {
  if (!provider?.request) throw new Error("Open this page in a browser with a test wallet.");
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  if (!addressPattern.test(accounts?.[0])) throw new Error("Choose a test wallet account.");
  return accounts[0];
}

export async function ensureNetwork(provider, account) {
  const chainId = "0x107d";
  if ((await provider.request({ method: "eth_chainId" })) !== chainId) {
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
    } catch (error) {
      if (error?.code !== 4902) throw error;
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId, chainName: "GenLayer Bradbury Phase 2",
          nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
          rpcUrls: [walletRpc], blockExplorerUrls: [chainExplorer],
        }],
      });
    }
  }
  const [id, block, accounts] = await Promise.all([
    provider.request({ method: "eth_chainId" }),
    provider.request({ method: "eth_getBlockByNumber", params: ["0x0", false] }),
    provider.request({ method: "eth_accounts" }),
  ]);
  if (id !== chainId || block?.hash?.toLowerCase() !== genesis) {
    throw new Error("Select Bradbury Phase 2 with the current RPC in your test wallet.");
  }
  if (accounts?.[0]?.toLowerCase() !== account.toLowerCase()) {
    throw new Error("The selected wallet changed. Connect the intended test account again.");
  }
}

export async function walletTransactionRequest(transaction, estimateGas) {
  const { from, to, data, value } = transaction;
  const gas = await estimateGas({ from, to, data, value: BigInt(value) });
  if (gas <= 0n) throw new Error("Bradbury returned an invalid gas estimate.");
  return { from, to, data, value, gas: `0x${((gas * 12n + 9n) / 10n).toString(16)}` };
}

export function signer(provider, account, onEnvelope) {
  let requested = false;
  return createClient({
    chain: testnetBradbury,
    endpoint: rpc,
    account,
    provider: {
      async request(request) {
        if (request.method !== "eth_sendTransaction") return provider.request(request);
        if (requested) throw new Error("This action already made a wallet request. Check its status before retrying.");
        requested = true;
        const transaction = await walletTransactionRequest(
          request.params[0],
          (payload) => publicClient.estimateTransactionGas(payload),
        );
        const hash = await provider.request({ method: request.method, params: [transaction] });
        if (!hashPattern.test(hash)) throw new Error("The wallet returned no valid transaction hash. Check wallet activity before retrying.");
        onEnvelope(hash);
        return hash;
      },
    },
  });
}

export async function estimateFees(account) {
  const units = 600n;
  const [{ distribution, feeValue }, balance] = await Promise.all([
    publicClient.estimateTransactionFees({
      leaderTimeunitsAllocation: units, validatorTimeunitsAllocation: units,
    }),
    publicClient.getBalance({ address: account }),
  ]);
  if (feeValue >= balance) {
    throw new Error(`The wallet has ${formatEther(balance)} test GEN. Add test GEN to cover the deposit and wallet gas.`);
  }
  return { distribution, feeValue };
}

export async function resolveEnvelope(hash) {
  const raw = await publicClient.request({ method: "eth_getTransactionReceipt", params: [hash] });
  if (!raw) return null;
  if (raw.status === "0x0") {
    throw Object.assign(new Error("The wallet transaction reverted on the chain."), { terminal: true });
  }
  return extractEnvelope(raw);
}

function extractEnvelope(receipt) {
  const events = parseEventLogs({
    abi: testnetBradbury.consensusMainContract.abi,
    eventName: "NewTransaction",
    logs: receipt.logs.filter(log => log.address.toLowerCase() === testnetBradbury.consensusMainContract.address.toLowerCase()),
  });
  if (!events[0]?.args?.txId) {
    throw Object.assign(new Error("The confirmed wallet transaction has no GenLayer submission event."), { terminal: true });
  }
  return events[0].args.txId;
}

export function walletErrorDetails(error) {
  const pending = [error];
  const seen = new Set();
  const details = [];
  while (pending.length && seen.size < 12) {
    const item = pending.shift();
    if (!item || typeof item !== "object" || seen.has(item)) continue;
    seen.add(item);
    const code = typeof item.code === "number" ? `[${item.code}] ` : "";
    const description = [item.shortMessage, item.message, item.details]
      .find(text => typeof text === "string" && text.trim());
    if (description) {
      const line = (code + description).replace(/0x[0-9a-f]{80,}/gi, "[calldata omitted]").slice(0, 280);
      if (!details.includes(line)) details.push(line);
    }
    pending.push(item.cause, item.data?.originalError, item.data, item.error);
  }
  return details.join("\n");
}

export function message(error) {
  if (error?.code === 4001 || error?.cause?.code === 4001) return "Wallet request declined.";
  return String(error?.shortMessage || error?.message || "Network request failed.").slice(0, 380);
}
