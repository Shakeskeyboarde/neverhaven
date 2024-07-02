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

  #position = { north: 0, east: 0 };
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

  *children(): Generator<GameNode, undefined> {
    for (const id of this.#childIds) {
      const node = this.#universe.getNode(id);
      if (node) yield node;
    }
  }

  setParent(parent: GameNodeId | null): void {
    if (!this.#allowMutation()) return;
    if (this.#parentId === parent) return;

    if (parent == null) {
      // The node is effectively being destroyed. Destroying a node also
      // destroys it's children recursively.
      this.#childIds.forEach((childId) => this.removeChild(childId));
    }

    if (this.#parentId !== null) {
      this.#universe.getNode(this.#parentId).removeChild(this.id);
    }

    this.#parentId = parent;
    this.#universe.emit('nodeParent', this.#id, parent);
  }

  addChild(child: GameNodeId): void {
    if (!this.#allowMutation()) return;
    if (this.#childIds.has(child)) return;
    this.#childIds.add(child);
    this.#universe.emit('nodeChildAdded', this.#id, child);
    this.#universe.getNode(child).setParent(this.id);
  }

  removeChild(child: GameNodeId): void {
    if (!this.#allowMutation()) return;
    if (!this.#childIds.delete(child)) return;
    this.#universe.emit('nodeChildRemoved', this.#id, child);
    this.#universe.getNode(child).setParent(null);
  }

  setPosition({ north, east }: GamePosition): void {
    if (!this.#allowMutation()) return;
    this.#position = { north, east };
    this.#universe.emit('nodePosition', this.#id, this.position);
  }
}
