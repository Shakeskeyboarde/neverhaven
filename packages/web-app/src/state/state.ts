import type { GameNodeId } from './node.js';
import type { GamePosition } from './position.js';
import { type AnyUniverseMessage, GameUniverse, type GameUniverseCapabilities } from './universe.js';

const PING_INTERVAL_MS = 1000;
const PING_MAX_PENDING = 3;

export class GameState extends GameUniverse {
  readonly #worker: Worker;

  #pingInterval: number | undefined;
  #pingCount = 0;
  #initialized = false;
  #capabilities: GameUniverseCapabilities | null = null;

  get capabilities(): GameUniverseCapabilities | null {
    return this.#capabilities;
  }

  constructor() {
    super();

    this.#worker = new Worker(new URL('worker.js', import.meta.url), { type: 'module' });
    this.#pingInterval = setInterval(this.#ping, PING_INTERVAL_MS);

    this._addSharedEventTarget(this.#worker);
    this.on('pong', this.#onPong);
    this.on('initializeSuccess', this.#onInitializeSuccess, { once: true });
    this.on('initializeFailure', this.#onInitializeFailure, { once: true });
    this.on('nodeParent', this.#onNodeParent);
    this.on('nodePosition', this.#onNodePosition);
  }

  disconnect(): void {
    clearInterval(this.#pingInterval);
    this._removeSharedEventTarget(this.#worker);
    this.#worker.terminate();
    this.emit('disconnect');
  }

  override _postSharedEventMessage(message: AnyUniverseMessage): void {
    switch (message.name) {
      case 'ping':
      case 'initialize':
        super._postSharedEventMessage(message);
        break;
      case 'pong':
      case 'initializeSuccess':
      case 'initializeFailure':
      case 'nodeParent':
      case 'nodeChildAdded':
      case 'nodeChildRemoved':
      case 'nodePosition':
      case 'disconnect':
        break;
    }
  }

  #mutate = (mutation: () => void): void => {
    const initialValue = this._allowMutation;

    try {
      this._allowMutation = true;
      mutation();
    }
    finally {
      this._allowMutation = initialValue;
    }
  };

  #ping = (): void => {
    if (this.#pingCount > PING_MAX_PENDING) {
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
      this.emit('initialize');
      console.debug('game state initializing');
    }
  };

  #onInitializeSuccess = (capabilities: GameUniverseCapabilities): void => {
    console.debug('game state initialized');
    this.#capabilities = capabilities;
  };

  #onInitializeFailure = (error: unknown): void => {
    console.error('game state initialization failed', error);
    this.disconnect();
  };

  #onNodeParent = (nodeId: GameNodeId, parent: GameNodeId | null): void => {
    this.#mutate(() => {
      this.getNode(nodeId).setParent(parent);
    });
  };

  #onNodePosition = (nodeId: GameNodeId, position: GamePosition): void => {
    this.#mutate(() => {
      this.getNode(nodeId).setPosition(position);
    });
  };
}
