import { type FC } from 'react';

import type { Game } from '../game/game.js';
import { GameProvider } from './game.js';
import { Stats } from './stats.js';

interface Props {
  game: Game;
}

export const App: FC<Props> = ({ game }) => {
  return (
    <GameProvider game={game}>
      <Stats />
    </GameProvider>
  );
};
