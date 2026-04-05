NUB-{NN}
========

{Title}
-------

`draft`

**NUB ID:** NUB-{NN}
**Domain:** {e.g., feed rendering, chat, collaborative editing}
**Requires:** {NUB-WORD interfaces needed, e.g., NUB-RELAY, NUB-IPC}
**Discovery:** `shell.supports("NUB-{WORD}", "NUB-{NN}")`

## Description

{One paragraph: what event semantics this protocol defines and for what purpose.}

## Event Semantics

{Define the event kinds, tags, and content structure that participating napplets
agree on.}

### Event: {name}

```json
{
  "kind": {kind},
  "tags": [{tag structure}],
  "content": "{content structure}"
}
```

{Behavioral requirements for producers and consumers.}

## Negotiation

{How napplets discover peers that support this protocol.}

## Implementations

- {links to implementations}
