import { type AnySharedEventMessage, SharedEvents } from '../util/shared-events.js';
import { GameNode, type GameNodeId } from './node.js';
import type { GamePosition } from './position.js';

export interface GameUniverseCapabilities {
  readonly db: boolean;
}

interface NodeCacheEntry {
  readonly id: GameNodeId;
  readonly next: NodeCacheEntry | null;
}

type EventTypes = {
  ping(): void;
  pong(): void;
  initialize(): void;
  initializeSuccess(capabilities: GameUniverseCapabilities): void;
  initializeFailure(reason: unknown): void;
  disconnect(): void;
  nodeParent(nodeId: GameNodeId, parent: GameNodeId | null): void;
  nodeChildAdded(nodeId: GameNodeId, child: GameNodeId): void;
  nodeChildRemoved(node: GameNodeId, child: GameNodeId): void;
  nodePosition(nodeId: GameNodeId, position: GamePosition): void;
};

export type AnyUniverseMessage = AnySharedEventMessage<EventTypes>;

const GAME_NODE_ROOT_ID = 0;

export class GameUniverse extends SharedEvents<EventTypes> {
  #nextNodeId = GAME_NODE_ROOT_ID;
  #nodes = new Map<GameNodeId, GameNode>();
  #nodesCache: NodeCacheEntry | null = null;

  /**
   * If true, node updates are allowed. If false, node updates are ignored.
   * Used to ensure only the worker can initiate node updates. The main thread
   * game state should only update nodes in response to worker events.
   */
  protected _allowMutation = false;

  constructor() {
    super('GameStateEventEmitter');
  }

  /**
   * Get a new or existing node.
   *
   * If no ID is given, or the ID does not exist, then a new or previously
   * destroyed node is returned. Otherwise, return the node matching the ID.
   */
  getNode(id?: GameNodeId): GameNode {
    if (id == null && this.#nodesCache) {
      ({ id, next: this.#nodesCache } = this.#nodesCache);
    }

    let node = id == null ? undefined : this.#nodes.get(id);

    if (!node) {
      // Create the node if no ID was given (explicitly create a new node), or
      // if the the ID was given, but it did not match an existing node.
      node = new GameNode(this, id ?? this.#nextNodeId++, this.#allowMutation);
      this.#nodes.set(node.id, node);
    }

    return node;
  }

  #allowMutation = (): boolean => {
    if (this._allowMutation) return true;
    if (import.meta.env.DEV) throw new Error('universe mutation not allowed');
    return false;
  };
}
