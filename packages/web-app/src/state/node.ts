import { type GamePosition } from './position.js';
import type { GameUniverse } from './universe.js';

export type GameNodeId = number;

/**
 * A single node in the game graph.
 */
export class GameNode {
  readonly #universe: GameUniverse;
  readonly #id: GameNodeId;
  readonly #allowMutation: () => boolean;

  #position: GamePosition = { north: 0, east: 0 };
  #parentId: GameNodeId | null = null;
  #childIds = new Set<GameNodeId>();

  get id(): GameNodeId {
    return this.#id;
  }

  get position(): GamePosition {
    return this.#position;
  }

  get parent(): GameNode | null {
    return this.#parentId === null ? null : this.#universe.getNode(this.#parentId);
  }

  constructor(universe: GameUniverse, id: GameNodeId, allowMutation: () => boolean) {
    this.#universe = universe;
    this.#id = id;
    this.#allowMutation = allowMutation;
  }

  /**
   * Iterate over this node's child nodes.
   */
  *children(): Generator<GameNode, undefined> {
    for (const id of this.#childIds) {
      const node = this.#universe.getNode(id);
      if (node) yield node;
    }
  }

  /**
   * Set the parent of this node. If this is set to null, the node is
   * considered "destroyed", and it may be reused as a "new" node in the
   * future.
   */
  setParent(parentId: GameNodeId | null, position: GamePosition = { north: 0, east: 0 }): void {
    if (!this.#allowMutation()) return;
    if (this.#parentId === parentId) return;

    if (this.#parentId !== null) {
      // Remove this node from its current parent.
      this.#universe.getNode(this.#parentId)._removeChild(this.id);
    }

    this.#parentId = parentId;
    this.#position = position;
    this.#universe.emit('nodeParent', this.#id, this.#parentId, this.#position);

    if (this.#parentId === null) {
      // The node is effectively being destroyed. Destroying a node also
      // destroys its children recursively, and resets its other state.
      this.#childIds.forEach((childId) => this.#universe.getNode(childId).setParent(null));
    }
    else {
      // Add this node to its new parent.
      this.#universe.getNode(this.#parentId)._addChild(this.id);
    }
  }

  /**
   * Set the position of this node, relative to its parent.
   */
  setPosition({ north, east }: GamePosition): void {
    if (this.#parentId === null) return;
    if (!this.#allowMutation()) return;
    this.#position = { north, east };
    this.#universe.emit('nodePosition', this.#id, this.position);
  }

  private _addChild = (childId: GameNodeId): void => {
    if (this.#childIds.has(childId)) return;
    this.#childIds.add(childId);
    this.#universe.emit('nodeChildAdded', this.#id, childId);
  };

  private _removeChild = (childId: GameNodeId): void => {
    if (!this.#childIds.delete(childId)) return;
    this.#universe.emit('nodeChildRemoved', this.#id, childId);
  };
}
