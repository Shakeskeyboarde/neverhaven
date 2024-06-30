import { GameStateEventEmitter } from './events.js';

const PING_INTERVAL_MS = 1000;

export class GameState extends GameStateEventEmitter {
  readonly #worker: Worker;

  #pingInterval: number | undefined;
  #pingCount = 0;
  #initialized = false;

  constructor() {
    super();

    this.#worker = new Worker(new URL('worker.js', import.meta.url), { type: 'module' });
    this.#pingInterval = setInterval(this.#ping, PING_INTERVAL_MS);

    this._connect(this.#worker);
    this.on('pong', this.#onPong);
    this.on('ready', this.#onReady);
  }

  disconnect(): void {
    clearInterval(this.#pingInterval);
    this._disconnect(this.#worker);
    this.#worker.terminate();
    this.emit('disconnect');
  }

  #ping = (): void => {
    if (this.#pingCount > 2) {
      console.error('game state worker not responding');
      this.disconnect();
      return;
    }

    this.emit('ping');
    this.#pingCount++;
  };

  #onPong = (): void => {
    // Reset the ping count so we know the worker is still responding.
    this.#pingCount = 0;

    if (!this.#initialized) {
      this.#initialized = true;
      this.emit('init');
      console.debug('game state worker initializing');
    }
  };

  #onReady = (): void => {
    console.debug('game state worker ready');
  };
}
