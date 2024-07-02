import { type EmitEventArgs, type EventListener, Events } from './events.js';

interface Target {
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  postMessage(message: any): void;
}

export interface SharedEventMessage<T extends Record<string, EventListener>, K extends keyof Omit<T, '*'>> {
  readonly channel: string;
  readonly name: K;
  readonly args: Parameters<T[K]>;
}

export type AnySharedEventMessage<T extends Record<string, EventListener>> = {
  [P in keyof Omit<T, '*'>]: SharedEventMessage<T, P>;
}[keyof Omit<T, '*'>];

/**
 * Event emitter which can be connected to other threads so that evens can be
 * shared between instances of the shared emitter with the same channel.
 */
export class SharedEvents<T extends Record<string, EventListener>> extends Events<T> {
  readonly #channel: string;
  readonly #targets = new Set<Target>();

  constructor(channel: string) {
    super();
    this.#channel = channel;
  }

  /**
   * Emit an event locally and to shared event targets.
   *
   * **Note:** Avoid overriding this method. Override the {@link _emit} or
   * {@link _postSharedEventMessage} methods instead.
   */
  override emit<K extends keyof Omit<T, '*'>>(
    ...[name, ...args]: EmitEventArgs<T, K>
  ): void {
    const message = this.#createMessage(name, args);

    this._emit(message);
    this._postSharedEventMessage(message);
  }

  /**
   * Emit a message locally only.
   *
   * Override to filter or mutate message before locally emitting.
   */
  protected _emit(message: AnySharedEventMessage<T>): void {
    super.emit(message.name, ...message.args);
  }

  /**
   * Post a message to shared event targets.
   *
   * Override to filter or mutate messages before posting to share targets.
   * This may help with performance by reducing the number of messages sent
   * between threads.
   */
  protected _postSharedEventMessage(message: AnySharedEventMessage<T>): void {
    this.#targets.forEach((target) => target.postMessage(message));
  }

  /**
   * Add a target that will receive posted event messages.
   */
  protected _addSharedEventTarget(target: Target): void {
    if (this.#targets.has(target)) return;

    target.addEventListener('message', this.#onWorkerMessage);
    this.#targets.add(target);
  }

  /**
   * Remove a target so that it will no longer receive posted event messages.
   */
  protected _removeSharedEventTarget(target: Target): void {
    target.removeEventListener('message', this.#onWorkerMessage);
    this.#targets.delete(target);
  }

  #onWorkerMessage = (
    { data: message }: MessageEvent<AnySharedEventMessage<T> | { channel?: undefined } | null>,
  ): void => {
    if (message?.channel === this.#channel) {
      this._emit(message);
    }
  };

  #createMessage = <K extends keyof Omit<T, '*'>>(name: K, args: Parameters<T[K]>): SharedEventMessage<T, K> => {
    return { channel: this.#channel, name, args };
  };
}
