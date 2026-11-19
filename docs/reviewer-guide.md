# Reviewer guide

## Confirm the release

Open the live website URL from the submission. Confirm that the **View Intelligent Contract** link opens the Bradbury Phase 2 address given in `deployment.json`. Open the [finalized deployment receipt](https://scan.bradbury.genlayer.com/tx/0x5e2dd9b59c1ec175e49078cb79a93550ba902022abfa3fd64fb635d2564fbe0f) to verify the deployment. Verification transactions are listed in `deployment.json` once their results are confirmed.

## Reproduce the result

1. Choose **Explicitly excluded work** on the site to load the sample repair quote and the proposed pipe replacement.
2. Connect a separate test wallet on Bradbury Phase 2 with test GEN. Select **Review network fee** to see the deposit. Select **Send for assessment** and approve the request in the wallet.
3. Open **View transaction in Explorer**. The site should show a status while validators are processing it.
4. For this sample, expect **Approval required** and a quotation identifying the exclusion of pipework inside the wall. The explanation wording may vary. Wait for **Finalized** to confirm the result is permanent.
5. If tracking pauses, click **Check transaction**. The app stores the last transaction reference in that browser so you can resume tracking after a reload.

| Sample | Expected verdict | Deciding evidence |
|---|---|---|
| Work already included | Included | The original price includes two flexible supply hoses. |
| Explicitly excluded work | Approval required | The original quote excludes pipework inside the wall. |
| Ambiguous scope | Unclear | “Associated plumbing as needed” leaves valve replacement unspecified. |

Use synthetic inputs. When validators cannot reach a successful verdict, inspect the linked receipt before making another submission.


## Bradbury compatibility incident

The first [on-chain assessment](https://scan.bradbury.genlayer.com/tx/0xf043167759d507826673cf882942d9a5e5dd73c093ff8acc8dd541ffb04b6416) used the explicitly excluded pipework sample. The expected verdict was `APPROVAL_REQUIRED`. The finalized execution returned an error and stored no verdict. The five validators committed and revealed votes, and the receipt records majority agreement on the failed execution.

The Explorer traceback identifies an unavailable method, `gl.vm.run_nondet_unsafe`. The corrected contract uses the documented `gl.vm.run_nondet` API with the same Bradbury runner. Each validator makes an independent AI evaluation and compares the three-value verdict with the leader's verdict. The contract checks that quotation evidence appears verbatim in the supplied quote. Invalid responses and validator evaluation failures cannot produce a stored verdict.

The original address in `deployment.json` is retained as historical deployment evidence. The corrected source requires a new deployment and a finalized live assessment before publication.

### Corrected contract preflight

Bradbury Phase 2 (chain 4221) accepted the corrected schema and executed its constructor in a read-only `gen_call`. The simulation reported GenVM `v0.3.0-rc10`. To exercise the unshipped assessment on that runner, an in-memory copy called the unchanged `assess` and `get_verdict` paths from its constructor. Each validator-mode run used its corresponding leader run's public data.

| Sample | Expected | Leader | Validator-mode result |
|---|---|---|---|
| Work already included | INCLUDED | INCLUDED | Agreed |
| Explicitly excluded work | APPROVAL_REQUIRED | APPROVAL_REQUIRED | Agreed |
| Ambiguous scope | UNCLEAR | UNCLEAR | Agreed |

An earlier simulation flagged disagreement on the ambiguous sample. The prompt now clarifies that a broad category alone does not establish exclusion of an unnamed component. All three cases agreed in the verification run for the corrected source (SHA-256 `be2c62fd9a92c6488fe73427a04e8406551def7a7e10c8a1ab9f0921ca59edae`). These simulations did not broadcast transactions or provide on-chain test evidence for the corrected contract.
