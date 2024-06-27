import { type FC, useEffect, useRef, useState } from 'react';

import { type GameStats } from '../game/game.js';
import { useGame } from './game.js';
import classes from './style.module.scss';

export const Stats: FC = () => {
  const game = useGame();
  const [visible, setVisible] = useState(game.debug);
  const renderCount = useRef(0);
  const [stats, setStats] = useState<GameStats | null>(null);

  useEffect(() => {
    setVisible(game.debug);

    return game.on('debugChanged', (debug) => {
      setVisible(debug);
    });
  }, []);

  useEffect(() => {
    return game.on('afterRender', () => {
      renderCount.current += 1;

      if (renderCount.current % 30 === 0) {
        setStats(game.getStats());
      }
    });
  }, []);

  if (!visible) return null;

  return (
    <div className={classes.stats}>
      <div>
        {`FPS: ${stats?.fps ?? 0}`}
      </div>
      <div>
        {`Frame: ${stats?.frame ?? 0}`}
      </div>
      <div>
        {`Time: ${getTimeString(stats?.timeMs ?? 0)}`}
      </div>
      <div>
        {`Calls: ${stats?.calls ?? 0}`}
      </div>
      <div>
        {`Triangles: ${stats?.triangles ?? 0}`}
      </div>
      <div>
        {`Lines: ${stats?.lines ?? 0}`}
      </div>
      <div>
        {`Points: ${stats?.points ?? 0}`}
      </div>
    </div>
  );
};

const getTimeString = (timeMs: number): string => {
  const hours = Math.floor(timeMs / 3_600_000);
  const minutes = Math.floor((timeMs % 3_600_000) / 60_000).toString(10).padStart(2, '0');
  const seconds = Math.floor((timeMs % 60_000) / 1000).toString(10).padStart(2, '0');
  const milliseconds = Math.floor(timeMs % 1000 * 1000).toString(10).padStart(6, '0');

  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};
