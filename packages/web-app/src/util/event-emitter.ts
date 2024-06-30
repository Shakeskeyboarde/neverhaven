export type EventListener = (...args: any[]) => void;

export type EmitArgs<T extends Record<string, EventListener>, K extends keyof Omit<T, '*'> = keyof Omit<T, '*'>> = {
  [P in K]: [name: P, ...args: Parameters<T[P]>];
}[K];

export type EventContext<T extends Record<string, EventListener>, K extends keyof Omit<T, '*'> = keyof Omit<T, '*'>> = {
  [P in K]: { name: K; args: Parameters<T[P]> };
}[K];

/**
 * Simple pub-sub events implementation.
 */
export class EventEmitter<T extends Record<string, EventListener>> {
  #listenersMap = new Map<unknown, Set<EventListener>>();

  constructor() {
    this.on = this.on.bind(this);
  }

  on<K extends keyof T | '*'>(name: K, listener: K extends '*' ? (event: EventContext<T>) => void : T[K]): () => void {
    let listeners = this.#listenersMap.get(name);

    if (!listeners) {
      listeners = new Set();
      this.#listenersMap.set(name, listeners);
    }

    const listener_: EventListener = (...args) => listener(...args as [any]);

    listeners.add(listener_);

    return () => {
      this.#listenersMap.get(name)?.delete(listener_);
    };
  }

  emit<K extends keyof Omit<T, '*'>>(...[name, ...args]: EmitArgs<T, K>): void {
    const listeners = this.#listenersMap.get(name);

    if (listeners) {
      for (const listener of listeners) {
        listener(...args);
      }
    }

    for (const listener of this.#listenersMap.get('*') ?? []) {
      listener({ name, args });
    }
  }
}
