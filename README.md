# Repair Scope Check

Repair Scope Check helps tenants, owners, and repair providers determine whether a proposed extra was already covered by an agreed quote. A visitor submits the relevant quote text and the requested work. The GenLayer Intelligent Contract records a scope assessment with a short explanation and a verbatim excerpt when one is available.

## How it works

1. The wallet signs a write request for Bradbury Phase 2. The app shows the network's consensus deposit before requesting the signature.
2. A leader model interprets the quote and extra work. Validators independently evaluate the same documents and compare the verdict with the leader's verdict. The contract checks that any excerpt is present in the supplied quote.
3. The app tracks the transaction, displays a provisional assessment when accepted, and marks the record finalized once the network confirms finality. The Explorer link and the case record remain available after a reload on the same device and browser.

The verdict is **Included**, **Approval required**, or **Unclear**. Approval required means the work falls outside the quoted scope. Unclear means the supplied wording lacks enough detail. The project assesses what the text covers. It cannot authenticate a quote, verify completed work, determine a fair price, or decide legal liability. Inputs are public on the testnet. Use synthetic or redacted documents.

## Release status

`deployment.json` is the source of truth for the contract address, deployment transaction, and verification transactions. An empty address means the frontend is in development and cannot submit a live case. Sample text is always editable. Its expected outcomes are test expectations. The app displays a verdict only when it reads a stored result from the contract.

- Network: GenLayer Bradbury Phase 2, chain ID `4221`
- Deployed contract: [`0x904cb85C5559A967e859E94e4fc8F93779eC6393`](https://scan.bradbury.genlayer.com/address/0x904cb85C5559A967e859E94e4fc8F93779eC6393)
- Finalized deployment: [`0x5e2dd9b59c1ec175e49078cb79a93550ba902022abfa3fd64fb635d2564fbe0f`](https://scan.bradbury.genlayer.com/tx/0x5e2dd9b59c1ec175e49078cb79a93550ba902022abfa3fd64fb635d2564fbe0f)
- [Bradbury Explorer](https://scan.bradbury.genlayer.com/)
- [Test GEN faucet](https://testnet-faucet.genlayer.foundation/)
- Project verification: [Reviewer guide](docs/reviewer-guide.md)
- Portal fields: [Submission checklist and copy](docs/submission.md)

## Run and test locally

Requires Node.js 24, pnpm 11.25.0, and Python 3.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm test:contract
pnpm build
pnpm dev --host 127.0.0.1
```

The JavaScript tests check input limits, sample coverage, and parsing of on-chain verdicts. The Python unit tests exercise validation and consensus gating with simulated GenVM and model responses. Live consensus verification requires a signed Bradbury transaction. See the reviewer guide for cases and expected results.

For deployment from the dev server, open `/deploy.html`, connect the approved test wallet, review the fee and sign. Record the verified deployment address and transaction, then run the reviewer cases. The production build includes the review app and its assets. GitHub Pages is published by manually running the **Publish GitHub Pages** workflow once the release metadata is populated and repository Pages settings use GitHub Actions.
