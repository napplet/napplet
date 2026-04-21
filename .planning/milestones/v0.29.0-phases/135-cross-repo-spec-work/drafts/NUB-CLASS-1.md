NUB-CLASS-1
===========

Strict Baseline Class
---------------------

`draft`

**NUB ID:** NUB-CLASS-1
**Parent:** NUB-CLASS
**Class number:** 1

## Description

NUB-CLASS-1 is the strict baseline posture for napplets that do not declare any class-contributing NUB capabilities. Shells emit a restrictive Content Security Policy with `connect-src 'none'`, show no consent prompt, and send `class.assigned` with `class: 1`. This is the default class for any napplet whose manifest lacks tags from NUBs that would promote it to a higher class.

## CSP Posture

```
connect-src 'none'
```

Shells emitting the NUB-CLASS-1 posture MUST include `connect-src 'none'` in the runtime CSP served with the napplet's HTML. The directive is the signal that the napplet has no user-approved direct-network origins. Other directives in the baseline CSP (e.g., `script-src`, `default-src`, `img-src`) are shell-policy concerns and are NOT specified by NUB-CLASS-1 — only the `connect-src` value is the class's defining characteristic.

## Manifest Prerequisites

NUB-CLASS-1 is the default posture. A napplet manifest reaches NUB-CLASS-1 when no other class-contributing NUB's trigger conditions are met. Future `NUB-CLASS-$N` entries (with `$N > 1`) MUST document their own trigger conditions; absence of all such triggers means the napplet is NUB-CLASS-1.

There is no consent state associated with NUB-CLASS-1 and therefore no user-consent prerequisite. A napplet resolves to this class at first load, at every subsequent load, and under every shell that implements the base protocol — independent of user action.

## Shell Responsibilities

- Shell MUST emit a runtime CSP header containing `connect-src 'none'` for the napplet's HTML response.
- Shell MUST NOT prompt the user for any network-access consent when serving a NUB-CLASS-1 napplet — there is nothing to consent to, and raising a prompt would mislead the user into believing a choice is available when none is.
- Shell MUST send exactly one `class.assigned` envelope with payload `{ class: 1 }` at iframe-ready time per NUB-CLASS's wire-timing rules. A shell that implements `nub:class` MUST deliver the envelope even when the value is `1`; silence is not the same signal as explicit assignment.
- Shell SHOULD treat residual `<meta http-equiv="Content-Security-Policy">` in NUB-CLASS-1 napplet HTML as harmless (CSP intersection of two `connect-src 'none'` values is still `'none'`), but MAY log a deployment warning to encourage napplet authors to migrate away from meta-CSP emission. Shells MUST NOT refuse-to-serve a NUB-CLASS-1 napplet solely on the basis of residual meta-CSP.
- Shell MUST NOT add sandbox relaxations or CSP directives that would cause a NUB-CLASS-1 napplet to behave distinguishably from another NUB-CLASS-1 napplet. The posture is uniform across all napplets in this class.

## Security Considerations

### Strictness floor, not a ceiling

NUB-CLASS-1 is the minimum-trust posture. It is appropriate for napplets with no network requirements, napplets that rely exclusively on shell-mediated resource fetching (via other NUBs that provide proxied resource access), or napplets in development/test environments where network egress is disabled by policy. A shell that wishes to apply a weaker posture than NUB-CLASS-1 cannot do so while claiming conformance to this class — the `connect-src 'none'` directive is not a default, it is a guarantee. A weaker posture is a different class and MUST be assigned a different integer.

### CSP intersection

Because the browser enforces CSP as an intersection of header and meta directives, a NUB-CLASS-1 napplet that accidentally ships meta-CSP with `connect-src 'none'` will still behave correctly — the intersection of `'none'` and `'none'` is `'none'`. This is why shells treat residual meta-CSP as harmless in the NUB-CLASS-1 case but refuse-to-serve in higher classes: a meta-CSP with `connect-src 'none'` silently suppresses any header-level grant, which is catastrophic for classes that rely on granted origins but a no-op here.

### No grant state

NUB-CLASS-1 has no persistent state — no consent decision, no origin list, no `(dTag, aggregateHash)` key. Every napplet resolving to NUB-CLASS-1 is indistinguishable from every other at the class level. This makes the class a safe default: a shell may assign it silently, without interrupting the user, without persisting any record that would outlive the session.

### Compatibility with other NUBs

NUB-CLASS-1 is deliberately compatible with every other NUB a shell may choose to implement. A shell may grant a NUB-CLASS-1 napplet access to, for example, a shell-mediated storage NUB or a shell-mediated relay NUB; the class does not forbid this. What the class forbids is the napplet reaching external network origins directly from the frame — everything network-sourced MUST flow through a shell-mediated NUB's `postMessage` surface.

## References

- `NUB-CLASS.md` — parent spec; defines the `class.assigned` envelope, the `window.napplet.class` runtime surface, and the authoring rules for track members including NUB-CLASS-1.
- NIP-5D — Napplet wire format.
