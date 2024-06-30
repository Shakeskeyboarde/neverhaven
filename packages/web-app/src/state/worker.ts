import { GameStateEventEmitter } from './events.js';

export class GameWorker extends GameStateEventEmitter {
  protected constructor() {
    super();
    this._connect(self);
    this.on('ping', this.#onPing);
    this.on('init', this.#onInit);
  }

  #onPing = (): void => {
    this.emit('pong');
  };

  #onInit = (): void => {
    // TODO: Initialize the game state.
    this.emit('ready');
  };

  // XXX: By including a singleton, just loading this file in the worker
  // will instantiate the worker class.
  static instance = new GameWorker();
}
