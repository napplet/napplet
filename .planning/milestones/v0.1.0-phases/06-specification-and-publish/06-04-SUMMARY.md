---
phase: 06-specification-and-publish
plan: 04
status: blocked
started: 2026-03-30
completed: null
commits: 0
blocker: "npm publish requires human authentication (npm login)"
---

# Plan 06-04: Publish to npm — Summary

## Status: BLOCKED (requires human action)

This plan requires npm authentication which cannot be performed autonomously.

## What's Ready

All three packages are validated and ready for publish:

### Dry-Run Results

| Package | Version | Size | Files |
|---------|---------|------|-------|
| @napplet/shim | 0.1.0-alpha.1 | 20.3 KB | 5 |
| @napplet/shell | 0.1.0-alpha.1 | 34.6 KB | 5 |
| @napplet/vite-plugin | 0.1.0-alpha.1 | 6.0 KB | 5 |

All dry-runs succeed. Each package contains: README.md, dist/index.d.ts, dist/index.js, dist/index.js.map, package.json.

## Human Action Required

### Step 1: Verify npm authentication

```bash
npm whoami
```

If not logged in:

```bash
npm login
```

### Step 2: Publish all three packages

```bash
cd packages/shim && npm publish --tag alpha --access public && cd ../..
cd packages/shell && npm publish --tag alpha --access public && cd ../..
cd packages/vite-plugin && npm publish --tag alpha --access public && cd ../..
```

### Step 3: Verify publication

```bash
npm view @napplet/shim@alpha version
npm view @napplet/shell@alpha version
npm view @napplet/vite-plugin@alpha version
```

Expected output for each: `0.1.0-alpha.1`

### Step 4: Test installation (optional)

```bash
mkdir /tmp/napplet-test-install && cd /tmp/napplet-test-install
npm init -y
npm install @napplet/shim@alpha nostr-tools
npm install @napplet/shell@alpha
npm install -D @napplet/vite-plugin@alpha
node -e "import('@napplet/shim').then(m => console.log('shim exports:', Object.keys(m)))"
node -e "import('@napplet/shell').then(m => console.log('shell exports:', Object.keys(m)))"
rm -rf /tmp/napplet-test-install
```

### Potential Issues

- **403 Forbidden**: npm scope `@napplet` not available or not authorized
- **402 Payment Required**: Scoped packages require npm organization. Create `@napplet` org on npmjs.com first.
- **ENEEDAUTH**: Run `npm login` first

## Self-Check: BLOCKED

- [x] All packages pass publint (zero errors)
- [x] All packages pass arethetypeswrong (ESM resolution validated)
- [x] All versions set to 0.1.0-alpha.1
- [x] Dry-run publish shows correct contents
- [ ] npm authentication verified (BLOCKED -- requires human)
- [ ] Packages published to npm (BLOCKED -- requires human)
- [ ] Packages installable from npm (BLOCKED -- requires human)
