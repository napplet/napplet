# @napplet/nub-identity

> ⚠️ **DEPRECATED** — This package is a re-export shim for backwards compatibility.
> **Migrate to `@napplet/nub/identity`** — all types, shim installers, and SDK
> helpers are now exported from there. This package will be removed in a future
> milestone.

This package exists solely to preserve the `@napplet/nub-identity` import path
for pinned consumers during the v0.26.0 deprecation window. New code SHOULD
import from `@napplet/nub/identity` directly.

## Migration

```ts
// Before
import { ... } from '@napplet/nub-identity';

// After
import { ... } from '@napplet/nub/identity';
```

All named exports, types, and (where applicable) side effects are preserved
byte-identically through the new path.
