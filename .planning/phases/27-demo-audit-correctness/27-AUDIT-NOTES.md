# Phase 27 Audit Notes

Manual checks that remain useful after the automated demo audit coverage.

| Scenario | Steps | Expected | If Wrong, Likely Layer |
| --- | --- | --- | --- |
| chat `relay:write` revoked but bot still replies through inter-pane | Open the demo, revoke chat `Relay Publish / Inter-Pane Send`, send a chat message, inspect chat status text, bot log, debugger, and sequence view. | Chat should show the inter-pane send attempt and exact `denied: relay:write` text. If the bot still replies, that is an explicit runtime behavior to verify against debugger path labels rather than a generic "shell failed" message. | runtime ACL |
| `state:read` revoked during history load | Revoke chat or bot `State Read`, reload the demo, and watch the napplet history/rule load message plus debugger entries. | The visible message should mention history/rule load failure and preserve `denied: state:read` instead of collapsing into "no history" or generic storage wording. | UI wording |
| `state:write` revoked during save | Revoke chat `State Write`, send a message, then teach the bot a rule and inspect both napplets. | Chat and bot should surface a save failure with `denied: state:write`, while other protocol paths continue to be labeled separately. | runtime ACL |
| `sign:event` revoked for a signer request | Revoke chat `Signer Requests`, send a message, and compare chat status, bot receipt, debugger detail, and sequence view. | Inter-pane chat delivery should remain visible if `relay:write` is still granted, while the publish path should surface `denied: sign:event` without waiting on a timeout. | service behavior |
| signer fallback vs signer service mode visibility | Load the demo and read the boot/debugger system messages plus any host metadata the UI exposes. | The host should identify whether it is in `service` mode or `fallback` mode so future demo work does not assume the wrong signer topology. | demo host wiring |
