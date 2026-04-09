# Quick Task 260409-gkz: Reformat napplet/nubs PR #9 body

## Task 1: Update PR #9 body via gh CLI

**Action:** Run `gh pr edit 9 --repo napplet/nubs --body "..."` with reformatted body matching the consistent NUB PR format.

**Format changes:**
- Move Namespace/Discovery/Status from inline bullets to bold header lines at top
- Fix Discovery to use full `window.napplet.shell.supports("keys")` (matching PRs #2-5, #8)
- Convert Summary from bullet list to prose paragraph
- Add Wire Protocol table (Type | Direction | Description) matching other NUBs
- Keep Key Design section as additional context
- Keep References section

**Verify:** `gh pr view 9 --repo napplet/nubs --json body` shows reformatted body
**Done:** PR body matches the format of PRs #1-8
