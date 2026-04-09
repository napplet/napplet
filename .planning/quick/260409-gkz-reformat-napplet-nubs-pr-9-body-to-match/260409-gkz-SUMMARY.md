# Quick Task 260409-gkz: Reformat napplet/nubs PR #9 body

## What changed

Updated the PR body of napplet/nubs#9 (NUB-KEYS) to match the consistent format used by all other NUB PRs (#1-8):

1. Moved Namespace/Discovery/Status from inline bullets to bold header lines at top
2. Fixed Discovery to use full `window.napplet.shell.supports("keys")` format
3. Converted Summary from bullet list to prose paragraph
4. Added Wire Protocol table (Type | Direction | Description) matching other NUBs
5. Removed Implementations section linking to private `napplet/napplet` repo
6. Removed `@napplet/shim` reference from References (private repo)
7. Kept Key Design section as additional context and GAP-07 reference

## No code changes

This was a PR body edit only via `gh pr edit`.
