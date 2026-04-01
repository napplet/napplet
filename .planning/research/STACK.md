# Nostr Naming Conventions Research

**Project:** Napplet Protocol SDK v0.7.0 -- Ontology Audit
**Researched:** 2026-04-01
**Overall confidence:** HIGH (sourced primarily from official NIP specifications)

---

## 1. Multi-word Message Verb Conventions

### Finding: ALL CAPS, hyphens for multi-word, prefix namespacing

NIP-01 defines the core message verbs, all single-word UPPER_CASE:

| Verb | Direction | NIP |
|------|-----------|-----|
| `EVENT` | both | NIP-01 |
| `REQ` | client-to-relay | NIP-01 |
| `CLOSE` | client-to-relay | NIP-01 |
| `OK` | relay-to-client | NIP-01 |
| `EOSE` | relay-to-client | NIP-01 |
| `CLOSED` | relay-to-client | NIP-01 |
| `NOTICE` | relay-to-client | NIP-01 |
| `AUTH` | both | NIP-42 |
| `COUNT` | both | NIP-45 |

**NIP-77 is the only NIP that defines multi-word verbs.** It uses UPPER_CASE with hyphens and a prefix namespace:

| Verb | Direction | NIP |
|------|-----------|-----|
| `NEG-OPEN` | client-to-relay | NIP-77 |
| `NEG-MSG` | both | NIP-77 |
| `NEG-CLOSE` | client-to-relay | NIP-77 |
| `NEG-ERR` | relay-to-client | NIP-77 |

**Key observations:**

1. **ALL CAPS is universal.** Every position-0 verb in every NIP uses UPPER_CASE. No exceptions.
2. **Hyphens, not underscores.** NIP-77 uses `NEG-OPEN`, not `NEG_OPEN`. This is the only multi-word example, but it establishes the precedent.
3. **Prefix namespacing.** NIP-77 puts all its verbs under a `NEG-` prefix. The spec explicitly states subscription IDs are "in a separate namespace from REQ subscription IDs." The prefix IS the namespace.
4. **No CamelCase.** No NIP uses CamelCase for position-0 verbs.
5. **Short verbs preferred.** Even single words are abbreviated: `REQ` not `REQUEST`, `AUTH` not `AUTHENTICATE`, `EOSE` not `END_OF_STORED_EVENTS`.

**Confidence:** HIGH -- sourced directly from NIP-01, NIP-42, NIP-45, NIP-77 raw markdown on GitHub.

### Implication for `INTER_PANE` -> `IPC-PEER`

The proposed `IPC-PEER` follows NIP-77 convention exactly:
- UPPER_CASE: yes
- Hyphen separator: yes (matches `NEG-OPEN` pattern)
- Prefix namespace (`IPC-`): yes (matches `NEG-` pattern)

`INTER_PANE` violates NIP convention: underscores are never used in position-0 verbs. However, note that `INTER_PANE` is currently a TypeScript constant name (`BusKind.INTER_PANE`), not a wire-format verb. The wire format uses kind numbers (29003), not verb strings. The constant naming convention (UPPER_SNAKE_CASE) is a TypeScript/JavaScript convention, not a NIP convention. Both can coexist: the constant can be `IPC_PEER` (TypeScript) while the conceptual name in docs/specs is `IPC-PEER` (NIP convention).

---

## 2. IPC / Inter-client Communication in NIPs

### Finding: No NIP defines IPC or inter-client messaging. This is novel territory.

After searching all NIPs listed in the official README:

- **No NIP addresses inter-client communication, IPC, sandboxing, embedded apps, or any client-to-client direct messaging protocol over the relay wire format.**
- NIP-17 (Private Direct Messages) uses gift-wrapping between users, but this is user-to-user, not client-to-client.
- NIP-29 (Relay-based Groups) defines group communication but through standard relay subscriptions, not IPC.
- NIP-46 (Nostr Connect) enables remote signing between apps, but it's a request-response pattern over relay events, not a co-located IPC bus.
- NIP-47 (Wallet Connect) is similar -- RPC over relay events.
- NIP-89 (Recommended Application Handlers) is about discovering apps, not communication between them.
- NIP-90 (Data Vending Machines) is job dispatch over relay events.

**The napplet protocol's inter-napplet messaging (kind 29003) is genuinely novel.** There is no NIP precedent for same-page IPC between co-located sandboxed applications.

**Confidence:** HIGH -- exhaustive search of all NIPs in the official repository README.

### Implication

The napplet SDK has freedom to name this however it wants. There is no existing convention to conform to. The `IPC-` prefix follows the NIP-77 `NEG-` namespacing pattern, which is the closest analogue (a custom subsystem with its own message namespace).

---

## 3. Subtype Naming Patterns

### Finding: NIPs do NOT use multi-word verbs for subtypes. They use separate kind numbers or topic strings.

**How NIPs distinguish message subtypes:**

1. **Separate verbs for related concepts:**
   - `CLOSE` (client imperative) vs `CLOSED` (relay notification) -- NIP-01
   - Past-tense suffix distinguishes action from state

2. **Different kind numbers for the same verb:**
   - `EVENT` carries kind 1 (text note), kind 0 (metadata), kind 3 (contacts), etc.
   - The verb is always `EVENT`; the kind number carries the semantic.

3. **Prefix namespace for verb families:**
   - NIP-77: `NEG-OPEN`, `NEG-MSG`, `NEG-CLOSE`, `NEG-ERR`
   - Four verbs sharing the `NEG-` prefix, each with a distinct single-word suffix

4. **Machine-readable prefixes in string fields (not position-0):**
   - NIP-01 OK/CLOSED reason prefixes: `duplicate`, `pow`, `blocked`, `rate-limited`, `invalid`, `restricted`, `mute`, `error`
   - Format: `prefix: human-readable message`
   - These are lowercase, hyphenated where multi-word (`rate-limited`)

5. **NIP-90 status codes:** `payment-required`, `processing`, `error`, `success`, `partial`
   - Lowercase, hyphenated

6. **Topic strings in NIP-17 tags:** `file-type`, `encryption-algorithm`, `decryption-key`
   - Lowercase, hyphenated

**Confidence:** HIGH -- multiple NIP sources.

### Implication for napplet topic naming

The napplet protocol's topic strings (e.g., `shell:audio-register`, `shell:state-get`) already follow Nostr convention: lowercase, hyphenated. The colon-delimited namespace prefix (`shell:`, `audio:`) is the napplet protocol's own convention and does not conflict with NIP patterns.

---

## 4. Napp vs Napplet Vocabulary

### Finding: "napp" IS an established Nostr ecosystem term. "napplet" is NOT.

**Evidence for "napp":**

- **NIP-C4 PR #2274** (nostr-protocol/nips): Title is "NIP-C4 - Nostr Apps (aka napps or nsites v3)". This PR explicitly defines "napps" as short for "Nostr Apps" -- static websites deployed via Blossom/nsite. PR status: closed (not merged), but it demonstrates the term is used in the NIP community.
- The napplet SPEC.md itself references NIP-C4 at line 24: `[NIP-C4 PR#2274](https://github.com/nostr-protocol/nips/pull/2274) (provisional) -- Napp kind numbers`
- The 44billion.net platform uses "napps" as a product concept.

**Evidence for "napplet":**

- Zero results in web search for "napplet" in the Nostr ecosystem.
- The term appears to be coined by/for this project only.
- Not used in any NIP, PR, or Nostr community discussion found.

**Semantic distinction:**

| Term | Meaning | Scope |
|------|---------|-------|
| **napp** | "Nostr app" -- a static website deployed on Nostr (NIP-C4 / nsite) | Full application, runs standalone |
| **napplet** | A sandboxed napp running inside a shell, delegating to the host | Embedded, sandboxed, dependent on shell |

This is analogous to "app" vs "applet" in the Java ecosystem -- an applet is a constrained, embedded version of an app.

**Confidence:** HIGH for "napp" being an established term. HIGH for "napplet" being novel to this project.

### Implication

The `napp` -> `napplet` rename proposed in v0.7.0 is semantically correct. A "napp" is a broader concept (any Nostr app). A "napplet" is specifically a sandboxed iframe app running under a shell's authority. Using "napp" for the sandboxed iframe case would be confusing because it conflates with the NIP-C4 meaning.

However, the codebase currently uses "napp" in several compound identifiers that may or may not need renaming:

| Current identifier | Context | Rename? |
|----|----|----|
| `nappType` | Vite plugin config, manifest field | Likely yes -- `nappletType` for clarity |
| `nappPubkey` / `NappKeypair` | Ephemeral session key | Likely yes -- `nappletPubkey` / `NappletKeypair` |
| `NappKeyRegistry` / `NappKeyEntry` | Shell registry | Likely yes -- `NappletKeyRegistry` / `NappletKeyEntry` |
| `nappState` / `nappStorage` | Shim API | Likely yes -- `nappletState` / `nappletStorage` |
| `nappClass` | Audio service field | Likely yes -- `nappletClass` |
| `napp-type` in HTML meta | `<meta name="napplet-napp-type">` | Yes -- currently a contradiction |

---

## 5. NIP API Naming Patterns (NIP-07, NIP-46, NIP-44)

### Finding: Two distinct conventions coexist depending on context.

**Browser JavaScript APIs (NIP-07): camelCase**

```
window.nostr.getPublicKey()
window.nostr.signEvent(event)
window.nostr.nip04.encrypt(pubkey, plaintext)
window.nostr.nip04.decrypt(pubkey, ciphertext)
window.nostr.nip44.encrypt(pubkey, plaintext)
window.nostr.nip44.decrypt(pubkey, ciphertext)
```

- Pure camelCase
- Verb-first naming: `getPublicKey`, `signEvent`
- Sub-object namespacing: `nip04.encrypt`, `nip44.encrypt`

**Remote RPC method names (NIP-46 Nostr Connect): snake_case**

```
connect
sign_event
ping
get_public_key
nip04_encrypt
nip04_decrypt
nip44_encrypt
nip44_decrypt
switch_relays
```

- Pure snake_case
- Same methods as NIP-07 but snake_case: `signEvent` -> `sign_event`, `getPublicKey` -> `get_public_key`
- Namespace prefix with underscore: `nip04_encrypt`, `nip44_encrypt`

**Remote RPC method names (NIP-47 Wallet Connect): snake_case**

```
pay_invoice
pay_keysend
make_invoice
lookup_invoice
list_transactions
get_balance
get_info
make_hold_invoice
cancel_hold_invoice
settle_hold_invoice
```

- Pure snake_case
- Verb-first: `pay_invoice`, `get_balance`

**Cryptographic pseudocode (NIP-44): snake_case**

```
calc_padded_len()
pad()
unpad()
decode_payload()
hmac_aad()
get_conversation_key()
get_message_keys()
encrypt()
decrypt()
```

- Pure snake_case for specification pseudocode

**nostr-tools JavaScript library: camelCase**

```
generateSecretKey()
getPublicKey()
finalizeEvent()
verifyEvent()
```

- camelCase, matching NIP-07 convention

**Confidence:** HIGH -- sourced from official NIP raw markdown.

### Summary table

| Context | Convention | Examples |
|---------|-----------|----------|
| Wire-format verbs (position-0) | UPPER_CASE, hyphen-separated | `EVENT`, `NEG-OPEN` |
| Browser JS APIs | camelCase | `getPublicKey()`, `signEvent()` |
| RPC method names over wire | snake_case | `sign_event`, `get_public_key` |
| Tag names | lowercase, single-letter or hyphenated | `e`, `p`, `file-type` |
| Status/reason strings | lowercase, hyphenated | `rate-limited`, `payment-required` |
| Spec pseudocode | snake_case | `get_conversation_key()` |
| TypeScript/JS library code | camelCase | `finalizeEvent()`, `verifyEvent()` |

---

## 6. Recommendations for Napplet SDK Ontology Audit

### 6.1 Wire-format verbs and conceptual names

**Use UPPER_CASE with hyphens for protocol concept names in specs/docs.**

The napplet protocol does not send custom verb strings over the wire (it uses NIP-01 `EVENT`/`REQ`/etc. with custom kind numbers). But when documenting the protocol concepts, follow NIP-77:

- `IPC-PEER` (not `IPC_PEER` or `ipc-peer`) for documentation and SPEC.md
- `IPC_PEER` for TypeScript constant names (UPPER_SNAKE_CASE is JS convention, not NIP convention)

### 6.2 TypeScript constant naming

**Keep UPPER_SNAKE_CASE for `BusKind` constants.** This follows TypeScript convention.

Current: `BusKind.INTER_PANE` -- TypeScript convention is correct (UPPER_SNAKE_CASE for constants).
Proposed: `BusKind.IPC_PEER` -- Still correct TypeScript convention.

The underscore in `IPC_PEER` is a TypeScript convention for the constant name. The hyphen in `IPC-PEER` is the NIP convention for the conceptual/documentation name. These are separate concerns.

### 6.3 The `napp` -> `napplet` rename

**Do it.** "napp" means "Nostr app" in the broader ecosystem (NIP-C4). "napplet" is this project's specific term for a sandboxed, shell-dependent iframe app. The rename avoids semantic collision and is more precise.

Apply to: type names, variable names, function parameter names, config keys, meta tag names, JSDoc. Preserve `napplet` in package scope name (`@napplet/*`) -- this is already correct.

### 6.4 API method naming

**Continue using camelCase for all TypeScript/JavaScript APIs.** This matches:
- NIP-07 (`window.nostr` API)
- nostr-tools library
- Standard JavaScript conventions

The napplet shim API (`subscribe`, `publish`, `query`, `emit`, `on`, `nappState`) already follows this pattern correctly.

### 6.5 Topic string naming

**Continue using lowercase hyphenated with colon namespace prefix.** Current pattern `shell:state-get`, `audio:register` aligns with:
- NIP-17 tag naming (`file-type`, `encryption-algorithm`)
- NIP-90 status codes (`payment-required`)
- NIP-01 reason prefixes (`rate-limited`)

The colon namespace is the napplet protocol's own convention and does not conflict.

### 6.6 Error reason strings

**Follow NIP-01 pattern: `prefix: human-readable message`.** Current napplet error patterns (`auth-required: ...`, `invalid: ...`, `quota exceeded: ...`) mostly align. Audit for consistency:
- `quota exceeded` should be `quota-exceeded` (hyphenated, per NIP-01 `rate-limited` precedent)
- All prefixes should be lowercase, single-word-or-hyphenated

### 6.7 `IPC-` namespace extensibility

The `IPC-` prefix follows NIP-77's `NEG-` pattern, establishing a namespace for future IPC verbs. Potential future verbs would naturally be:
- `IPC-PEER` (current: inter-napplet messaging)
- `IPC-BROADCAST` (hypothetical: all-napplet broadcast)
- `IPC-DIRECT` (hypothetical: targeted single-napplet)

This is clean and extensible.

---

## Sources

### Official NIP Specifications (HIGH confidence)

- [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) -- Core message verbs: EVENT, REQ, CLOSE, OK, EOSE, CLOSED, NOTICE. Error prefix convention.
- [NIP-42](https://github.com/nostr-protocol/nips/blob/master/42.md) -- AUTH verb.
- [NIP-44](https://github.com/nostr-protocol/nips/blob/master/44.md) -- snake_case pseudocode convention.
- [NIP-45](https://github.com/nostr-protocol/nips/blob/master/45.md) -- COUNT verb.
- [NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md) -- snake_case RPC method names: sign_event, get_public_key, etc.
- [NIP-47](https://github.com/nostr-protocol/nips/blob/master/47.md) -- snake_case RPC methods: pay_invoice, get_balance, etc.
- [NIP-77](https://github.com/nostr-protocol/nips/blob/master/77.md) -- Multi-word verbs with prefix namespace: NEG-OPEN, NEG-MSG, NEG-CLOSE, NEG-ERR.
- [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md) -- camelCase browser API: getPublicKey(), signEvent().
- [NIP-17](https://github.com/nostr-protocol/nips/blob/master/17.md) -- Hyphenated tag names: file-type, encryption-algorithm.
- [NIP-89](https://github.com/nostr-protocol/nips/blob/master/89.md) -- "application" / "handler" vocabulary (no "napp" or "napplet").
- [NIP-90](https://github.com/nostr-protocol/nips/blob/master/90.md) -- Hyphenated status codes: payment-required, processing.
- [NIP-29](https://github.com/nostr-protocol/nips/blob/master/29.md) -- Group communication via standard relay events (no IPC).

### Community / Ecosystem (MEDIUM confidence)

- [NIP-C4 PR #2274](https://github.com/nostr-protocol/nips/pull/2274) -- "Nostr Apps (aka napps or nsites v3)". Closed PR establishing "napp" as "Nostr app" terminology.
- [NIP-5A PR #2287](https://github.com/nostr-protocol/nips/pull/2287) -- Aggregate hash spec referenced by napplet protocol.
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools) -- camelCase JavaScript API convention.
- [nostrapps.com](https://nostrapps.com/) -- Nostr app directory (uses "apps" not "napps" or "napplets").

### Codebase (HIGH confidence)

- `/home/sandwich/Develop/napplet/SPEC.md` -- Current napplet protocol spec, references NIP-C4 and NIP-5A.
- `/home/sandwich/Develop/napplet/packages/core/src/constants.ts` -- Current BusKind constants with INTER_PANE.
