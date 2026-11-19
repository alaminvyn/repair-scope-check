import "./style.css";
import { isSuccessful } from "genlayer-js";
import { formatEther } from "viem";
import code from "../contracts/repair_scope_check.py?raw";
import { addressPattern, chainExplorer, connectWallet, ensureNetwork, estimateFees, explorer, message, publicClient, resolveEnvelope, signer, walletErrorDetails } from "./network.js";

const el = id => document.getElementById(id);
const say = text => { el("state").textContent = text; };
function showError(error) {
  el("details").textContent = walletErrorDetails(error);
  el("diagnostics").hidden = !el("details").textContent;
  if (!el("diagnostics").hidden) el("diagnostics").open = true;
}
function clearError() {
  el("diagnostics").hidden = true;
  el("details").textContent = "";
}
const storageKey = "repair-scope-deployment-v1";
let preparation;
let sent = JSON.parse(sessionStorage.getItem(storageKey) || "null");
const save = () => { sessionStorage.setItem(storageKey, JSON.stringify(sent)); };
function showLink() {
  el("link").hidden = !sent;
  el("link").href = sent?.hash ? `${explorer}/tx/${sent.hash}` : `${chainExplorer}/tx/${sent?.envelope}`;
  el("check").disabled = !sent;
}
showLink();
if (sent) el("prepare").disabled = true;

el("prepare").onclick = async () => {
  clearError();
  el("prepare").disabled = true;
  el("deploy").disabled = true;
  try {
    const expected = el("expected").value.trim();
    if (!addressPattern.test(expected)) throw new Error("Enter the signed-off test wallet’s full public address.");
    const owner = await connectWallet(window.ethereum);
    if (owner.toLowerCase() !== expected.toLowerCase()) throw new Error("Choose the approved separate test wallet.");
    await ensureNetwork(window.ethereum, owner);
    const fees = await estimateFees(owner);
    preparation = { owner, fees };
    say(`Consensus deposit ${formatEther(fees.feeValue)} test GEN. Review the separate gas fee in your wallet.`);
    el("deploy").disabled = false;
  } catch (err) {
    say(message(err));
    showError(err);
  } finally {
    el("prepare").disabled = false;
  }
};

el("deploy").onclick = async () => {
  if (!preparation || sent) return;
  clearError();
  const { owner, fees } = preparation;
  el("prepare").disabled = true;
  el("deploy").disabled = true;
  try {
    if (el("expected").value.trim().toLowerCase() !== owner.toLowerCase()) {
      throw new Error("Reconnect after changing the approved wallet address.");
    }
    await ensureNetwork(window.ethereum, owner);
    say("Review the deployment in your wallet.");
    const client = signer(window.ethereum, owner, (envelope) => {
      sent = { envelope };
      save();
      showLink();
      say("Wallet transaction sent. Waiting for the chain receipt.");
    });
    const hash = await client.deployContract({ code, args: [], fees });
    sent = { ...sent, hash };
    save();
    showLink();
    say("Deployment submitted. Use Check deployment for the verdict.");
  } catch (err) {
    say(message(err));
    showError(err);
    if (!sent) say(`${message(err)} No hash was returned. Check wallet activity before another attempt.`);
    el("prepare").disabled = Boolean(sent);
  }
};

el("check").onclick = async () => {
  el("check").disabled = true;
  try {
    if (!sent.hash) {
      sent.hash = await resolveEnvelope(sent.envelope);
      if (!sent.hash) return say("Waiting for the wallet transaction to be confirmed.");
      save();
    }
    const receipt = await publicClient.getTransaction({ hash: sent.hash });
    const address = receipt.recipient || receipt.to_address;
    const success = isSuccessful(receipt);
    if (success && addressPattern.test(address)) {
      say(`${receipt.statusName}: ${address}`);
    } else say(receipt.statusName || "Pending");
  } catch (err) {
    say(message(err));
    showError(err);
  } finally {
    showLink();
  }
};
