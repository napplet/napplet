# @napplet/boilerplate

## 0.3.2

### Patch Changes

- b17e944: Make the standalone CLI dispatch bundled create and skills package code without a runtime Node.js or package-resolver dependency, and expose import-safe callable CLI entry points from the maintained packages.

## 0.3.1

### Patch Changes

- dd7b3a7: Update shipped generator, conformance CLI, and agent-skill guidance for
  queryless convention identities, optional same-tag event kinds, authoritative
  intent URIs, acceptance-before-delivery, runtime-attested sender, and
  carrier-neutral delivery without a public NAP-INC dependency.

## 0.3.0

### Minor Changes

- 49a8658: Make developer onboarding CLI-first from installation through deployment. The
  Napplet CLI now creates starters, owns deployment metadata, installs agent
  skills, prints a linked developer guide, and ships as checksum-verified
  standalone binaries. The boilerplate
  generator no longer prompts for deployment metadata, and the bundled skills
  teach the same ordered workflow as the CLI, docs, and web app.

## 0.2.1

### Patch Changes

- d6291de: Point generated projects to the current skills, remove undocumented build-time config guidance, and keep hard `count` requirements from being dropped by the Vite plugin.

## 0.2.0

### Minor Changes

- 110a346: Add an interactive generator package for creating napplets from the
  github.com/napplet/boilerplate template.
