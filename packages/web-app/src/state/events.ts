import { SharedEvents } from '../util/shared-events.js';

type Events = {
  ping(): void;
  pong(): void;
  init(): void;
  ready(): void;
  disconnect(): void;
};

export class GameStateEvents extends SharedEvents<Events> {
  constructor() {
    super('GameStateEventEmitter');
  }
}
