import { SharedEventEmitter } from '../util/shared-event-emitter.js';

type GameStateEvents = {
  ping(): void;
  pong(): void;
  init(): void;
  ready(): void;
  disconnect(): void;
};

export class GameStateEventEmitter extends SharedEventEmitter<GameStateEvents> {
  constructor() {
    super('GameStateEventEmitter');
  }
}
