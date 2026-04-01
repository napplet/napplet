# Leader-Line Import Error Investigation

## Problem
When starting the demo dev server (`pnpm --filter @napplet/demo dev`), the browser showed:
```
Uncaught SyntaxError: The requested module 'http://localhost:5174/node_modules/.vite/deps/leader-line.js?v=...' doesn't provide an export named: 'default'
```

## Root Cause
**leader-line is a UMD (Universal Module Definition) library**, not an ESM module.

The package.json indicates:
- `"main": "leader-line.min.js"`
- No `"exports"` field (no ESM entry point defined)
- Package contains ONLY minified UMD output

The UMD pattern is:
```javascript
var LeaderLine = (function() { 
  "use strict"; 
  // ... implementation
  return { /* object with API */ }; 
})();
```

This creates a global `window.LeaderLine` variable but does NOT export an ESM default export.

### Why Vite failed
When Vite was configured with `optimizeDeps: { include: ['leader-line'] }`, it attempted to:
1. Pre-bundle the dependency with esbuild
2. Wrap it to provide ESM compatibility
3. Create a transpiled version at `node_modules/.vite/deps/leader-line.js`

However, the UMD code doesn't have a compatible export structure for automatic ESM wrapping. Vite's esbuild correctly identified that there's NO default export to provide.

## Solution Implemented ✓
**Load leader-line as a classic script tag (Option 4 - best for UMD)**

### Changes Made

**1. Updated `apps/demo/index.html`** (line 316):
```html
<!-- Load leader-line UMD before main app (creates window.LeaderLine) -->
<script src="/node_modules/leader-line/leader-line.min.js"></script>

<script type="module" src="/src/main.ts"></script>
```

**2. Updated `apps/demo/vite.config.ts`** (removed optimizeDeps):
- Deleted `optimizeDeps: { include: ['leader-line'] }` configuration

**3. Updated `apps/demo/src/topology.ts`** (lines 1-4):
```typescript
// Load leader-line - a UMD library that doesn't have proper ESM exports
// We need to require it in a way that makes it available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const LeaderLine: any;
```

### Why This Works

1. **Script tag loads UMD**: The classic `<script>` tag loads leader-line.min.js before the ESM modules start, ensuring `window.LeaderLine` is created
2. **No Vite interference**: Vite doesn't try to pre-bundle or optimize the library  
3. **Global access**: Declare the global type in TypeScript, and access it directly in code
4. **Zero overhead**: leader-line is already minified, no build optimization needed
5. **Proven pattern**: This is how UMD libraries were designed to be used

## Verification Results ✓

Testing shows:
- **Dev server starts**: ✓ No errors
- **Page loads**: ✓ Full topology renders without console errors
- **LeaderLine global**: ✓ Available as `window.LeaderLine` (type: function)
- **SVG lines render**: ✓ Visible connecting lines between all topology nodes with directional arrows
- **Edge flasher works**: ✓ `initTopologyEdges()` executes without errors
- **No console errors**: ✓ Only harmless 404 favicon error

The topology visualization is now fully functional with leader-line SVG edges connecting napplets, shell, ACL, runtime, and service nodes.
