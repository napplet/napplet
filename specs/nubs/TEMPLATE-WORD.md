NUB-{NAME}
==========

{Title}
-------

`draft`

**NUB ID:** NUB-{NAME}
**Namespace:** `window.napplet.{name}` (or `window.nostr`, `window.nostrdb`)
**Discovery:** `shell.supports("NUB-{NAME}")`

## Description

{One paragraph: what this interface provides and why.}

## API Surface

{Method signatures with brief descriptions. Use markdown code blocks for types.}

```
interface {Name} {
  method(param: type): ReturnType;
}
```

## Shell Behavior

{What the shell MUST and MAY do when providing this interface.}

## Event Kinds

{If this interface uses postMessage bus kinds, define them here.}

| Kind | Name | Direction | Description |
|------|------|-----------|-------------|
| {kind} | {NAME} | {napplet->shell / shell->napplet} | {description} |

## Security Considerations

{Interface-specific security requirements.}

## Implementations

- {links to implementations}
