import type { RelayPoolLike, NostrEvent, NostrFilter } from '@napplet/shell';

/**
 * In-memory relay pool for test isolation.
 * Stores published events and returns matching events on subscription/request.
 */
export interface MockRelayPool extends RelayPoolLike {
  /** All events published through this pool */
  publishedEvents: NostrEvent[];
  /** Pre-seed events that will be returned by subscriptions */
  seedEvents: NostrEvent[];
  /** Clear all stored and seeded events */
  reset(): void;
}

function matchesFilter(event: NostrEvent, filter: NostrFilter): boolean {
  if (filter.kinds && !filter.kinds.includes(event.kind)) return false;
  if (filter.authors && !filter.authors.some(a => event.pubkey.startsWith(a))) return false;
  if (filter.ids && !filter.ids.some(id => event.id.startsWith(id))) return false;
  if (filter.since && event.created_at < filter.since) return false;
  if (filter.until && event.created_at > filter.until) return false;
  // Tag filters (#t, #p, #e, etc.)
  for (const [key, values] of Object.entries(filter)) {
    if (key.startsWith('#') && Array.isArray(values)) {
      const tagName = key.slice(1);
      const eventTagValues = event.tags
        .filter(t => t[0] === tagName)
        .map(t => t[1]);
      if (!values.some(v => eventTagValues.includes(v))) return false;
    }
  }
  return true;
}

export function createMockRelayPool(): MockRelayPool {
  const publishedEvents: NostrEvent[] = [];
  const seedEvents: NostrEvent[] = [];

  function getMatchingEvents(filters: NostrFilter[]): NostrEvent[] {
    const allEvents = [...seedEvents, ...publishedEvents];
    return allEvents.filter(event =>
      filters.some(filter => matchesFilter(event, filter))
    );
  }

  return {
    publishedEvents,
    seedEvents,

    subscription(relayUrls: string[], filters: NostrFilter[]) {
      const matching = getMatchingEvents(filters);
      return {
        subscribe(observer: (item: unknown) => void) {
          for (const event of matching) {
            observer(event);
          }
          return { unsubscribe() {} };
        },
      };
    },

    publish(_relayUrls: string[], event: NostrEvent) {
      publishedEvents.push(event);
    },

    request(_relayUrls: string[], filters: NostrFilter[]) {
      const matching = getMatchingEvents(filters);
      return {
        subscribe(observer: { next: (event: unknown) => void; complete: () => void; error: () => void }) {
          for (const event of matching) {
            observer.next(event);
          }
          observer.complete();
          return { unsubscribe() {} };
        },
      };
    },

    reset() {
      publishedEvents.length = 0;
      seedEvents.length = 0;
    },
  };
}
