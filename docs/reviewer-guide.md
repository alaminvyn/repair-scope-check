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
