import { createContext, type FC, type PropsWithChildren, useContext } from 'react';

import { type Game } from '../game/game.js';

const GameContext = createContext<Game | null>(null);

export const GameProvider: FC<PropsWithChildren<{ game: Game }>> = ({ game, children }) => {
  return (
    <GameContext.Provider value={game}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): Game => {
  const game = useContext(GameContext);

  if (game === null) {
    throw new Error('GameProvider required');
  }

  return game;
};
