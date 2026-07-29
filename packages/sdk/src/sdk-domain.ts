import type { NappletGlobal } from '@napplet/core';

/** Non-nullable SDK domain surface. */
export type SdkDomain<K extends keyof NappletGlobal> = NonNullable<NappletGlobal[K]>;
