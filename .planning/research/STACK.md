# Technology Stack

**Project:** napplet protocol SDK
**Researched:** 2026-03-30
**Focus:** Testing, demo, and spec tooling (core protocol stack is already built)

## Existing Stack (Keep As-Is)

These are already in place and working. No changes recommended.

| Technology | Version | Purpose |
|------------|---------|---------|
| TypeScript | 5.9.3 | Language, strict ESM-only |
| tsup | 8.5.0 | Per-package bundling |
| turborepo | 2.5.0+ | Monorepo task orchestration |
| pnpm | 10.8.0 | Package manager with workspaces |
| changesets | 2.30.0 | Versioning and npm publishing |
| nostr-tools | 2.23.3 | Crypto primitives (peer dep) |

Note: tsup is no longer actively maintained (maintainer recommends tsdown), but 8.5.x is stable and works. Migrating to tsdown is not in scope for this milestone -- revisit when a breaking issue arises.

## Recommended Additions

### Testing Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| vitest | ^4.1.2 | Test runner and assertion library | Stable browser mode (v4.0, Oct 2025). Native TypeScript, ESM-first, integrates with turborepo caching. Same Vite transform pipeline the project already uses. | HIGH |
| @vitest/browser-playwright | ^4.1.1 | Browser provider for Vitest | Playwright provider gives access to real Chromium/Firefox/WebKit, `frameLocator` API for iframe element queries, and Commands API for server-side `page.evaluate()`. Required for testing real postMessage flows across iframe boundaries. | HIGH |
| playwright | ^1.58.2 | Browser automation engine | Underlying engine for Vitest browser mode. Full `page.evaluate()`, network interception, frame access, and cross-origin iframe support. Already installed system-wide on this machine. | HIGH |
| @vitest/coverage-v8 | ^4.1.2 | Code coverage | V8-native coverage, works in both Node and browser modes. Integrates with turborepo output caching. | HIGH |

**Why Vitest over Playwright Test directly:** The project already uses Vite (via vite-plugin package) and turborepo. Vitest 4 integrates natively with both -- same config format, same transform pipeline, turborepo-cacheable `vitest run` commands. Using Playwright Test standalone would add a separate config system and lose the Vite ecosystem integration.

**Why not Jest:** Jest has poor ESM support, requires transform workarounds for TypeScript, and `postMessage` does not trigger message event listeners in jsdom (known open issue since 2018). The napplet protocol cannot be tested meaningfully in jsdom/happy-dom because:
- jsdom sets `event.origin` to empty string on postMessage (breaks origin validation)
- happy-dom has iframe support but incomplete postMessage semantics
- Neither environment can enforce `sandbox` attribute restrictions (no allow-same-origin testing)
- Real browser testing is the only reliable path for this protocol

### Testing Architecture

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vitest browser mode (per-package) | -- | Unit + integration tests per package | Turborepo-cacheable per-package test runs. Each package gets its own `vitest.config.ts` extending a shared config. | HIGH |
| Vitest browser commands (custom) | -- | Cross-iframe postMessage test harness | Custom `BrowserCommand` functions that use Playwright's `page.evaluate()` to inject message listeners into iframes, spy on postMessage calls, and assert message flows from the server side. This is the key pattern for testing the napplet protocol. | MEDIUM |
| `@repo/test-utils` (internal package) | -- | Shared test harness for shell+shim | Internal workspace package providing: mock pseudo-relay, mock ShellHooks, test napplet iframe builder, postMessage spy utilities, AUTH handshake helpers. Prevents test code duplication across packages. | HIGH |

**Custom Commands pattern for postMessage testing:**
The napplet protocol requires testing messages between a shell (parent page) and shim (sandboxed iframe). Vitest browser mode runs tests in the browser, but the test itself runs in its own iframe. To test cross-iframe postMessage:

1. Use Vitest custom `BrowserCommand` to access Playwright's `page` on the server
2. From `page`, create a sandboxed iframe via `page.evaluate()`
3. Register `message` event listeners on both parent and iframe windows
4. Assert message sequences (REQ, EVENT, CLOSE, AUTH, OK, EOSE, etc.)
5. Return results to the browser-side test assertion

This avoids the jsdom/happy-dom limitations entirely and tests real browser behavior.

### Demo / Playground

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vite | 6.3.0 (keep existing peer) | Dev server for demo app | Already a peer dependency for vite-plugin. Multi-page app mode serves shell + multiple napplet iframes. HMR for fast iteration. | HIGH |
| Vanilla TypeScript | -- | Demo shell + demo napplets | Framework-agnostic SDK needs framework-agnostic demos. No Svelte, React, or Vue in the demo. Plain DOM manipulation + SDK imports. | HIGH |
| mermaid | ^11.13.0 | Sequence diagrams in protocol debugger | Render live message flow as sequence diagrams. Text-based definition (easy to generate from message logs). Embeddable in any HTML page. | MEDIUM |

**Why vanilla TS for demos:** The SDK is framework-agnostic by design. Demos in vanilla TS prove the SDK works without any framework and serve as reference implementations. Using Svelte/React would signal a framework preference and add build complexity.

**Why NOT WebContainers / StackBlitz embeds:** WebContainers require `SharedArrayBuffer` and cross-origin isolation headers (`Cross-Origin-Embedder-Policy: require-corp`). The napplet protocol uses `postMessage` with `'*'` origin and sandboxed iframes without `allow-same-origin`. These are fundamentally incompatible constraints -- COEP would block the napplet iframes from loading cross-origin resources. Build a custom demo app instead.

### Protocol Debugger (Visual Message Flow)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Custom web component | -- | `<message-debugger>` panel | A custom element that intercepts all postMessage traffic between shell and napplet iframes, renders it as a filterable, scrollable log with color-coded message types (REQ=blue, EVENT=green, AUTH=yellow, etc.). No framework dependency. | MEDIUM |
| mermaid (runtime API) | ^11.13.0 | Live sequence diagram generation | `mermaid.render()` API generates SVG sequence diagrams from accumulated message logs. Toggle between log view and diagram view. | MEDIUM |

**Why custom component over off-the-shelf tools:** No existing tool understands NIP-01 wire format. The debugger needs to parse REQ/EVENT/CLOSE/AUTH/OK/EOSE/NOTICE messages, display filter objects, show event content, and highlight ACL decisions. This is domain-specific UI that must be built, but it is simple -- a scrollable list with JSON formatting.

### NIP Specification Tooling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| VitePress | ^1.6.4 | Spec site generator | Markdown-first SSG. Renders NIP spec documents with syntax highlighting, table of contents, and search. Same Vite ecosystem. Deploys to GitHub Pages. | MEDIUM |
| markdown-it (via VitePress) | -- | Markdown rendering | VitePress uses markdown-it internally. Custom plugins can add NIP-specific rendering (event kind tables, tag format highlighting, message flow diagrams via mermaid plugin). | MEDIUM |
| vitepress-plugin-mermaid | latest | Mermaid diagrams in spec docs | Render protocol flow diagrams inline in NIP specification markdown. | LOW |

**Why VitePress over raw markdown:** The NIP-5A spec is currently a single markdown file in the hyprgate repo. A VitePress site adds: navigation between spec sections, search, anchored headers for linking, rendered code examples, and embedded sequence diagrams. This makes the spec more useful for implementors.

**Why NOT Docusaurus/Nextra:** VitePress is the same Vite ecosystem. Docusaurus adds React, Nextra adds Next.js -- both pull in frameworks the project explicitly avoids depending on.

**NIP markdown format:** NIPs follow the format established by nostr-protocol/nips: plain markdown with `## Section` headers, JSON/JSONC code blocks for message formats, uppercase requirement keywords (MUST, SHOULD, MAY), and inline backtick references to field names. No special tooling needed beyond standard markdown.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Test runner | Vitest 4 (browser mode) | Playwright Test standalone | Separate config system, no Vite transform integration, no turborepo task alignment |
| Test runner | Vitest 4 (browser mode) | Jest + jsdom | postMessage broken in jsdom (origin=''), no iframe sandbox enforcement, poor ESM support |
| Test runner | Vitest 4 (browser mode) | Web Test Runner (@web/test-runner) | Smaller ecosystem, less turborepo integration, Vitest has critical mass |
| Browser env | Real browser (Playwright) | happy-dom | Incomplete postMessage semantics, no sandbox attribute enforcement |
| Browser env | Real browser (Playwright) | jsdom | postMessage origin tracking broken, no iframe sandbox support |
| Demo framework | Vanilla TypeScript | Lit / Web Components library | Unnecessary abstraction for simple demo pages |
| Demo framework | Vanilla TypeScript | Svelte | Would signal framework preference, hyprgate already covers Svelte |
| Spec site | VitePress | Docusaurus | Adds React dependency, heavier, different ecosystem |
| Spec site | VitePress | Raw GitHub markdown | No search, no navigation, no embedded diagrams |
| Diagrams | Mermaid (runtime) | D3.js | Massive overkill for sequence diagrams, steep learning curve |
| Diagrams | Mermaid (runtime) | GoJS | Commercial license, heavyweight |

## Installation

```bash
# Testing (root devDependencies)
pnpm add -Dw vitest@^4.1.2 @vitest/browser-playwright@^4.1.1 @vitest/coverage-v8@^4.1.2

# Playwright browsers (if not already installed system-wide)
# NOTE: On this system, Playwright browsers are already installed via pacman
# DO NOT run `npx playwright install` -- see AGENTS.md

# Demo / debugger
pnpm add -Dw mermaid@^11.13.0

# Spec site (separate workspace or root devDep)
pnpm add -Dw vitepress@^1.6.4
```

## Configuration Patterns

### Vitest + Turborepo (per-package approach)

```jsonc
// turbo.json
{
  "tasks": {
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    }
  }
}
```

```typescript
// packages/shell/vitest.config.ts
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
    include: ['src/**/*.test.ts'],
  },
})
```

### Shared Test Utils Package

```
packages/
  test-utils/           # @napplet/test-utils (internal, not published)
    src/
      mock-relay.ts     # Mock pseudo-relay for shim tests
      mock-hooks.ts     # Mock ShellHooks for shell tests
      iframe-builder.ts # Create sandboxed test iframes
      message-spy.ts    # postMessage spy/assertion utilities
      auth-helpers.ts   # AUTH handshake test helpers
```

## Version Compatibility Matrix

| Package | Min Version | Max Tested | Notes |
|---------|------------|------------|-------|
| vitest | 4.0.0 | 4.1.2 | Browser mode stable from 4.0 |
| @vitest/browser-playwright | 4.0.0 | 4.1.1 | Must match vitest major |
| playwright | 1.50.0 | 1.58.2 | Vitest 4 works with recent Playwright |
| vitepress | 1.5.0 | 1.6.4 | Stable, no breaking changes expected |
| mermaid | 11.0.0 | 11.13.0 | Sequence diagram API stable since v10 |
| Node.js | 22.x | 22.x | Required for vitest 4 browser mode |

## Sources

- [Vitest 4.0 Release Blog](https://vitest.dev/blog/vitest-4) - Browser mode stability, visual regression, Playwright traces
- [Vitest Browser Mode Guide](https://vitest.dev/guide/browser/) - Configuration, providers, iframe architecture
- [Vitest Browser Commands API](https://vitest.dev/api/browser/commands) - Custom commands, Playwright context access
- [Turborepo Vitest Guide](https://turborepo.dev/docs/guides/tools/vitest) - Per-package vs projects configuration
- [Vitest 4.0 InfoQ Coverage](https://www.infoq.com/news/2025/12/vitest-4-browser-mode/) - Feature overview and context
- [Playwright iframe Testing](https://playwright.dev/docs/api/class-frame) - Frame API, frameLocator, evaluate
- [Playwright Sandboxed iframe Issue #33343](https://github.com/microsoft/playwright/issues/33343) - Known sandboxed iframe limitations
- [jsdom postMessage Issue #2245](https://github.com/jsdom/jsdom/issues/2245) - postMessage event listener broken
- [jsdom Origin Tracking Issue #2745](https://github.com/jsdom/jsdom/issues/2745) - postMessage origin empty string
- [Vitest iframe API Issue #6966](https://github.com/vitest-dev/vitest/issues/6966) - iframe content access discussion
- [Mermaid.js](https://mermaid.js.org/) - Sequence diagram generation
- [VitePress](https://vitepress.dev/) - Markdown-first documentation site
- [Nostr NIPs Repository](https://github.com/nostr-protocol/nips) - NIP format conventions
- [NIP-01 Specification](https://github.com/nostr-protocol/nips/blob/master/01.md) - Canonical NIP markdown format
