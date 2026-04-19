# @napplet/shim

## 0.2.1

### Patch Changes

- Republish at 0.2.1 to ship resolved workspace dependency versions. The 0.2.0 tarballs on npm contained unresolved `workspace:*` specs in dependencies, breaking installs. This patch bump exists solely to produce correctly-assembled tarballs via `pnpm publish -r` (which rewrites `workspace:*` → concrete versions at pack time).
- Updated dependencies
  - @napplet/core@0.2.1
  - @napplet/nub-config@0.2.1
  - @napplet/nub-identity@0.2.1
  - @napplet/nub-ifc@0.2.1
  - @napplet/nub-keys@0.2.1
  - @napplet/nub-media@0.2.1
  - @napplet/nub-notify@0.2.1
  - @napplet/nub-relay@0.2.1
  - @napplet/nub-storage@0.2.1
