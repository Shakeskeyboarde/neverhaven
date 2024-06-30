import { SharedEvents } from '../util/shared-events.js';

export class GameStateEvents extends SharedEvents<{
  ping(): void;
  pong(): void;
  init(): void;
  ready(): void;
  disconnect(): void;
}> {
  constructor() {
    super('GameStateEventEmitter');
  }
}
