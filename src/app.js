import "./style.css";
import { isSuccessful } from "genlayer-js";
import { formatEther } from "viem";
import deployment from "../deployment.json";
import { examples, labels, parseVerdict, validateInput } from "./cases.js";
import { explorer, chainExplorer, addressPattern, hashPattern, publicClient, connectWallet, ensureNetwork, estimateFees, signer, resolveEnvelope, message } from "./network.js";

const el = (id) => document.getElementById(id);
const address = deployment.contractAddress;
const key = `repair-scope-case:${address || "local"}`;
let wallet;
let draft;
let current;
let busy = false;
let polling = false;
try {
  const stored = JSON.parse(localStorage.getItem(key));
  if (stored && addressPattern.test(stored.owner) && /^[a-f0-9]{32}$/.test(stored.id) &&
      (hashPattern.test(stored.hash) || hashPattern.test(stored.envelope))) current = stored;
} catch { /* The app can continue without stored history. */ }

function status(text) { el("status").textContent = text; }
function error(text = "") {
  el("error").textContent = text;
  el("error").hidden = !text;
}
function save() {
  try { localStorage.setItem(key, JSON.stringify(current)); } catch { /* Progress remains available on this page. */ }
}
function update() {
  el("connect").textContent = wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : "Connect wallet";
  el("submit").disabled = busy || Boolean(draft) || Boolean(current && !current.done);
  el("confirm").hidden = !draft;
  el("send").disabled = busy;
  el("cancel").disabled = busy;
  el("resume").hidden = !current || Boolean(current.done) || polling;
  el("tx-link").hidden = !current?.hash && !current?.envelope;
  if (current?.hash) el("tx-link").href = `${explorer}/tx/${current.hash}`;
  else if (current?.envelope) el("tx-link").href = `${chainExplorer}/tx/${current.envelope}`;
}
function showVerdict(value) {
  el("verdict").textContent = labels[value.verdict];
  el("excerpt").textContent = value.quote_excerpt;
  el("excerpt").hidden = !value.quote_excerpt;
  el("explanation").textContent = value.explanation;
  el("result").hidden = false;
}
async function connect() {
  wallet = await connectWallet(window.ethereum);
  update();
  if (!current) status(address ? "Wallet connected. Submit a case when ready." : "Contract deployment is pending.");
}

async function track() {
  if (!current || polling) return;
  polling = true;
  update();
  error();
  let failures = 0;
  try {
    for (let attempt = 0; attempt < 48; attempt += 1) {
      try {
        if (!current.hash && current.envelope) {
          current.hash = await resolveEnvelope(current.envelope);
          if (current.hash) { save(); update(); }
        }
        if (!current.hash) {
          status("Waiting for the wallet transaction to be confirmed.");
        } else {
          const receipt = await publicClient.getTransaction({ hash: current.hash });
          const life = receipt.lifecycle;
          if (life?.state === "canceled" || life?.state === "finalized" && !isSuccessful(receipt)) {
            current.done = true;
            save();
            status(`No verdict · ${receipt.statusName || life.state}`);
            error("The transaction closed without a successful contract result. Review the explorer receipt before trying a new case.");
            return;
          }
          if (isSuccessful(receipt)) {
            const raw = await publicClient.readContract({
              address, functionName: "get_verdict", args: [current.owner, current.id],
              transactionHashVariant: life?.state === "finalized" ? "latest-final" : "latest-nonfinal",
            });
            if (raw) showVerdict(parseVerdict(raw));
            if (raw && life?.state === "finalized") {
              current.done = true;
              save();
              status("Finalized · Verdict recorded on Bradbury");
              return;
            }
            status(raw ? "Accepted · Awaiting finalization" : "Consensus reached · Waiting for the verdict record");
          } else {
            const detail = life?.phase || life?.outcome || receipt.statusName || "pending";
            status(`On-chain status · ${String(detail).replaceAll("-", " ")}`);
          }
        }
        failures = 0;
      } catch (err) {
        if (err?.terminal || failures++ >= 2) throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 6500));
    }
    status("Still processing. Use Check transaction to resume.");
  } catch (err) {
    if (err?.terminal) {
      current.done = true;
      save();
    }
    status(err?.terminal ? "Wallet transaction closed without a verdict." : "Tracking paused. Your transaction is saved.");
    error(message(err));
  } finally {
    polling = false;
    update();
  }
}

el("connect").addEventListener("click", async () => {
  error();
  try { await connect(); } catch (err) { error(message(err)); }
});
window.ethereum?.on?.("accountsChanged", () => {
  wallet = undefined;
  if (!busy) draft = undefined;
  update();
});
el("example").addEventListener("change", (event) => {
  const sample = examples[event.target.value];
  if (sample) { el("quote").value = sample.quote; el("extra").value = sample.extra; }
});
el("assessment").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy || draft || current && !current.done) return;
  error();
  if (!addressPattern.test(address || "")) return error("No verified deployment is configured in this build.");
  const quote = el("quote").value.trim();
  const extra = el("extra").value.trim();
  if (!validateInput(quote, extra)) return error("Check the minimum and maximum lengths of both fields.");
  busy = true;
  update();
  try {
    if (!wallet) await connect();
    const owner = wallet;
    await ensureNetwork(window.ethereum, owner);
    const fees = await estimateFees(owner);
    draft = { id: crypto.randomUUID().replaceAll("-", ""), quote, extra, owner, fees };
    el("fee-detail").textContent = `Consensus deposit: ${formatEther(fees.feeValue)} test GEN. Your wallet shows the network gas separately.`;
  } catch (err) {
    error(message(err));
  } finally {
    busy = false;
    update();
  }
});
el("cancel").addEventListener("click", () => { draft = undefined; update(); });
el("send").addEventListener("click", async () => {
  if (!draft || busy) return;
  busy = true;
  update();
  error();
  const { id, quote, extra, owner, fees } = draft;
  const record = { id, owner };
  try {
    await ensureNetwork(window.ethereum, owner);
    const client = signer(window.ethereum, owner, (envelope) => {
      record.envelope = envelope;
      current = record;
      save();
      update();
      status("Sent · Waiting for wallet confirmation on the network");
    });
    status("Approve the assessment in your test wallet.");
    record.hash = await client.writeContract({
      address, functionName: "assess", args: [id, quote, extra], fees,
    });
    current = record;
    save();
    draft = undefined;
    el("result").hidden = true;
    status("Sent · Waiting for GenLayer consensus");
  } catch (err) {
    if (record.envelope) {
      draft = undefined;
      el("result").hidden = true;
      status("Sent · Checking your saved transaction");
    } else {
      status("Ready for a new wallet confirmation.");
      error(message(err));
    }
  } finally {
    busy = false;
    update();
  }
  if (current === record) void track();
});
el("resume").addEventListener("click", () => void track());
if (addressPattern.test(address || "")) {
  el("contract-link").href = `${explorer}/address/${address}`;
  el("contract-link").hidden = false;
} else status("Contract deployment is pending.");
update();
if (current) void track();
