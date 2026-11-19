# Repair Scope Check

Repair Scope Check helps tenants, owners, and repair providers determine whether a proposed extra was already covered by an agreed quote. A visitor submits the relevant quote text and the requested work. The GenLayer Intelligent Contract records a scope assessment with a short explanation and a verbatim excerpt when one is available.

## How it works

1. The wallet signs a write request for Bradbury Phase 2. The app shows the network's consensus deposit before requesting the signature.
2. A leader model interprets the quote and extra work. Validators independently evaluate the same documents and compare the verdict with the leader's verdict. The contract checks that any excerpt is present in the supplied quote.
3. The app tracks the transaction, displays a provisional assessment when accepted, and marks the record finalized once the network confirms finality. The Explorer link and the case record remain available after a reload on the same device and browser.

The verdict is **Included**, **Approval required**, or **Unclear**. Approval required means the work falls outside the quoted scope. Unclear means the supplied wording lacks enough detail. The project assesses what the text covers. It cannot authenticate a quote, verify completed work, determine a fair price, or decide legal liability. Inputs are public on the testnet. Use synthetic or redacted documents.

## Release status

The corrected contract is deployed and finalized on Bradbury Phase 2. The explicitly excluded work case finalized with the expected on-chain verdict, **Approval required**. The reviewer guide includes the incident, simulation results, and live verification.

`deployment.json` is the source of truth for the contract address, deployment transaction, and verification transactions. An empty address means the frontend is in development and cannot submit a live case. Sample text is always editable. Its expected outcomes are test expectations. The app displays a verdict only when it reads a stored result from the contract.

- Public release links: [Repository](https://github.com/alaminvyn/repair-scope-check) · [GitHub Pages](https://alaminvyn.github.io/repair-scope-check/)
- Network: GenLayer Bradbury Phase 2, chain ID `4221`
- Deployed contract: [`0x7D24a5590b828901eFD95af1e4E6a7D483E899eA`](https://scan.bradbury.genlayer.com/address/0x7D24a5590b828901eFD95af1e4E6a7D483E899eA)
- Finalized deployment: [`0x4e6f18eb2f6e63d358a9b8cb326382fce638307fa2b08fc7b8e7fc68fbee64eb`](https://scan.bradbury.genlayer.com/tx/0x4e6f18eb2f6e63d358a9b8cb326382fce638307fa2b08fc7b8e7fc68fbee64eb)
- [Bradbury Explorer](https://scan.bradbury.genlayer.com/)
- [Test GEN faucet](https://testnet-faucet.genlayer.foundation/)
- Finalized assessment: [**Approval required**](https://scan.bradbury.genlayer.com/tx/0xfde3d0349615657aaff5394acc34badbfb7a2690c135b06ec050e3426940f595)
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
