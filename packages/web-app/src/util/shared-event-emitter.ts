import { type EmitArgs, EventEmitter } from './event-emitter.js';

interface Target {
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  postMessage(message: any): void;
}

interface Data<T extends Record<string, EventListener>, K extends keyof Omit<T, '*'>> {
  readonly channel: string;
  readonly name: K;
  readonly args: Parameters<T[K]>;
}

type AnyData<T extends Record<string, EventListener>> = {
  [P in keyof Omit<T, '*'>]: Data<T, P>;
}[keyof Omit<T, '*'>];

/**
 * Event emitter which can be connected to other threads so that evens can be
 * shared between instances of the shared emitter with the same channel.
 */
export class SharedEventEmitter<T extends Record<string, EventListener>> extends EventEmitter<T> {
  readonly #channel: string;
  readonly #targets = new Set<Target>();

  constructor(channel: string) {
    super();
    this.#channel = channel;
  }

  override emit<K extends keyof Omit<T, '*'>>(
    ...[name, ...args]: EmitArgs<T, K>
  ): void {
    super.emit(name, ...args);
    const message = this.#createMessageData(name, args);
    this.#targets.forEach((target) => target.postMessage(message));
  }

  /**
   * Connect to a target thread.
   */
  protected _connect(target: Target): void {
    if (this.#targets.has(target)) return;

    target.addEventListener('message', this.#onWorkerMessage);
    this.#targets.add(target);
  }

  /**
   * Disconnect from a target thread.
   */
  protected _disconnect(target: Target): void {
    target.removeEventListener('message', this.#onWorkerMessage);
    this.#targets.delete(target);
  }

  #onWorkerMessage = ({ data }: MessageEvent<AnyData<T> | { channel?: undefined } | null>): void => {
    if (data?.channel === this.#channel) {
      super.emit(data.name, ...data.args);
    }
  };

  #createMessageData = <K extends keyof Omit<T, '*'>>(name: K, args: Parameters<T[K]>): Data<T, K> => {
    return { channel: this.#channel, name, args };
  };
}
