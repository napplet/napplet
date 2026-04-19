# @napplet/nub-storage

> ⚠️ **DEPRECATED** — This package is a re-export shim for backwards compatibility.
> **Migrate to `@napplet/nub/storage`** — all types, shim installers, and SDK
> helpers are now exported from there. This package will be removed in a future
> milestone.

This package exists solely to preserve the `@napplet/nub-storage` import path
for pinned consumers during the v0.26.0 deprecation window. New code SHOULD
import from `@napplet/nub/storage` directly.

## Migration

```ts
// Before
import { ... } from '@napplet/nub-storage';

// After
import { ... } from '@napplet/nub/storage';
```

All named exports, types, and (where applicable) side effects are preserved
byte-identically through the new path.
