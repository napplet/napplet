NUB-CLASS-1 Amendment: CSP Violation Reporting
==============================================

`draft amendment`

**Amends:** NUB-CLASS-1 (currently on `nub-class-1` branch of napplet/nubs)
**Coordinated with:** NUB-IDENTITY amendment (see 137-NUB-IDENTITY-AMENDMENT.md — same PR)
**Wire change:** none — this NUB has no wire surface; amendment affects the runtime CSP posture emitted by conformant shells and the shell-side report-processing obligation
**Branch in this work:** nub-identity-decrypt (bundled with NUB-IDENTITY amendment per CLASS1-03)

## Summary

Adds two bulleted rows to NUB-CLASS-1's Shell Responsibilities section:

1. **SHOULD** — shells SHOULD emit a `report-to` directive (with matching `Report-To` response header) pointing at a shell-owned reporting endpoint alongside the existing `connect-src 'none'` baseline. SHOULD rather than MUST — minimalist shells without report-ingestion infrastructure remain conformant.
2. **MUST** — shells MUST process received CSP violation reports by correlating to napplet identity via `(dTag, aggregateHash)` through the napplet HTML URL path. Browsers deliver (at minimum) `violatedDirective`, `blockedURI`, `documentURI`, and `sourceFile`; shells MUST tolerate `sourceFile: null` (inline-injection on Chromium) and scheme-only `documentURI` values for `data:`-served documents. Shells MUST NOT pin the `violatedDirective` to an exact sub-directive string — Chromium 144+ emits `script-src-elem` while older versions emit `script-src`, and both are valid. The MUST row's policy-latitude clause uses the verbatim phrases `MAY refuse-to-serve` and `shell MAY reject` (these are grep targets for VER-03 Group E).

Also adds a new `### Violation reporting is observability, not enforcement` subsection under Security Considerations making explicit that:
- CSP reports are notifications of what the browser already prevented, not a consent-gate.
- Extension-originated main-world injections (e.g., `chrome.scripting.executeScript({world:'MAIN'})`) bypass page CSP entirely — no report fires. The structural mitigation is `connect-src 'none'` trapping plaintext inside the frame regardless of how it was obtained.

## Diff Summary

The amendment touches exactly two locations in `NUB-CLASS-1.md`:

1. **Shell Responsibilities** — appended two bullets at the end of the existing five-bullet list (no existing bullet is edited; no existing bullet is reordered). The appended bullets are the SHOULD `report-to` row and the MUST violation-correlation row. The original five bullets are byte-identical to the `nub-class-1` branch tip.
2. **Security Considerations** — inserted one new `### Violation reporting is observability, not enforcement` subsection after `### Compatibility with other NUBs` and before `## References`. The existing four subsections (Strictness floor, CSP intersection, No grant state, Compatibility with other NUBs) are byte-identical to the `nub-class-1` branch tip.

Out-of-scope sections that remain byte-unchanged from `nub-class-1`: metadata header (title, subtitle, `draft` tag, NUB ID / Parent / Class number lines), `## Description`, `## CSP Posture`, `## Manifest Prerequisites`, `## References`. A `git diff nub-class-1..nub-identity-decrypt -- NUB-CLASS-1.md` shows 8 insertions, 0 deletions across two hunks.

## Rationale

NUB-CLASS-1 is the load-bearing class for plaintext-handling NUBs (see the companion NUB-IDENTITY amendment adding `identity.decrypt`). A shell that serves a napplet plaintext needs a mechanism to learn when a legacy `<script>`-tag content-script injection was attempted against that napplet. The `report-to` / `Report-To` CSP mechanism is the standard browser-side telemetry channel for exactly this; this amendment lifts that mechanism into NUB-CLASS-1's Shell Responsibilities so shells operating under this class have a consistent reporting surface.

The MUST row specifies the minimum shell-side obligation: correlate reports to napplet identity. It does NOT specify what the shell then DOES with the correlated report — the policy-latitude clause names four permitted responses (shell MAY refuse-to-serve future loads; shell MAY reject subsequent `identity.decrypt` envelopes; surface to user; log-only) and is explicit that the choice between them is shell policy latitude. That would be an inappropriate cross-shell constraint for a protocol document to impose.

The two Chromium quirks documented in the MUST row (`sourceFile: null` for inline injections; scheme-only `documentURI` for non-`https:` documents) are empirical observations made while validating the posture on Chromium 144+ — documenting them in the spec prevents shell authors from tripping on `null`-unsafe parsers when deploying their report-ingestion endpoints.

## Backward Compatibility

The amendment is additive: two new bullets appended to Shell Responsibilities (existing 5 bullets unchanged, byte-identical) and one new subsection in Security Considerations (existing 4 subsections unchanged, byte-identical). No existing shell implementation is rendered non-conformant — shells already shipping `connect-src 'none'` without `report-to` are still NUB-CLASS-1-conformant under the new SHOULD (SHOULD does not promote them to non-conformant; it expresses a shell-ecosystem expectation). Shells that already emit `report-to` but don't process reports become newly non-conformant under the new MUST — the amendment tightens that specific obligation.

## Implementations

- (none yet)
