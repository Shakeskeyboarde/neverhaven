export type EventListener = (...args: any[]) => void;

export type EmitEventArgs<T extends Record<string, EventListener>, K extends keyof Omit<T, '*'> = keyof Omit<T, '*'>> = {
  [P in K]: [name: P, ...args: Parameters<T[P]>];
}[K];

export type EventContext<T extends Record<string, EventListener>, K extends keyof Omit<T, '*'> = keyof Omit<T, '*'>> = {
  [P in K]: { name: K; args: Parameters<T[P]> };
}[K];

export interface OnEventOptions {
  readonly once?: boolean;
}

/**
 * Simple pub-sub events implementation.
 */
export class Events<T extends Record<string, EventListener>> {
  #handlers = new Map<unknown, Set<EventListener>>();

  constructor() {
    this.on = this.on.bind(this);
  }

  /**
   * Add an event listener. Returns a function which removes the listener (ie.
   * an `off` function).
   */
  on<K extends keyof T | '*'>(
    name: K,
    listener: K extends '*' ? (event: EventContext<T>) => void : T[K],
    { once = false }: OnEventOptions = {},
  ): () => void {
    let listeners = this.#handlers.get(name);

    if (!listeners) {
      listeners = new Set();
      this.#handlers.set(name, listeners);
    }

    const handler: EventListener = once
      ? (...args) => {
          listener(...args as [any]);
          off();
        }
      : (...args) => {
          listener(...args as [any]);
        };

    const off = (): void => {
      this.#handlers.get(name)?.delete(handler);
    };

    listeners.add(handler);

    return off;
  }

  /**
   * Emit an event.
   */
  emit<K extends keyof Omit<T, '*'>>(...[name, ...args]: EmitEventArgs<T, K>): void {
    const handlers = this.#handlers.get(name);

    if (handlers) {
      for (const handler of handlers) {
        handler(...args);
      }
    }

    for (const handler of this.#handlers.get('*') ?? []) {
      handler({ name, args });
    }
  }
}
