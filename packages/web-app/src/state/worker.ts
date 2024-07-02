import { type AnyUniverseMessage, GameUniverse } from './universe.js';

export class GameWorker extends GameUniverse {
  #db: IDBDatabase | null = null;

  protected constructor() {
    super();
    this._addSharedEventTarget(self);
    this.on('ping', this.#onPing);
    this.on('initialize', this.#onInitialize, { once: true });
  }

  override _postSharedEventMessage(data: AnyUniverseMessage): void {
    switch (data.name) {
      case 'pong':
      case 'initializeSuccess':
      case 'initializeFailure':
      case 'nodeParent':
      case 'nodePosition':
        super._postSharedEventMessage(data);
        break;
      case 'ping':
      case 'initialize':
      case 'nodeChildAdded':
      case 'nodeChildRemoved':
      case 'disconnect':
        break;
    }
  }

  #openDatabase = (): Promise<IDBDatabase | null> => new Promise((resolve, reject) => {
    const req = indexedDB.open('GameWorker', 1);

    req.addEventListener('success', function () {
      resolve(this.result);
    });

    req.addEventListener('blocked', function () {
      // XXX: The game will still work, but all progress will be lost if the
      // user navigates away from the page.
      resolve(null);
    });

    req.addEventListener('error', function () {
      reject(this.error);
    });
  });

  #onPing = (): void => {
    this.emit('pong');
  };

  #onInitialize = (): void => {
    Promise.resolve().then(async () => {
      // TODO: Initialize the game state.
      this.#db = await this.#openDatabase();
      this.emit('initializeSuccess', { db: this.#db !== null });
    }).catch((error) => {
      this.emit('initializeFailure', error);
    });
  };

  // XXX: By including a singleton, just loading this file in the worker
  // will instantiate the worker class.
  static instance = new GameWorker();
}
