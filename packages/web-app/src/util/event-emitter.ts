export class EventEmitter<T extends Record<string, ((...args: any[]) => void)>> {
  #listenerMap = new Map<unknown, Set<(...args: unknown[]) => void>>();

  constructor() {
    this.on = this.on.bind(this);
  }

  on<K extends keyof T>(type: K, listener: T[K]): () => void {
    let listeners = this.#listenerMap.get(type);

    if (!listeners) {
      listeners = new Set();
      this.#listenerMap.set(type, listeners);
    }

    const listener_ = (...args: unknown[]): void => listener(...args);

    listeners.add(listener_);

    return () => {
      this.#listenerMap.get(type)?.delete(listener_);
    };
  }

  emit<K extends keyof T>(type: K, ...args: Parameters<T[K]>): void {
    const listeners = this.#listenerMap.get(type);

    if (listeners) {
      for (const listener of listeners) {
        listener(...args);
      }
    }
  }
}
