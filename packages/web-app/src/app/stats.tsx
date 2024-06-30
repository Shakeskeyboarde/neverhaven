import { type FC, useEffect, useState } from 'react';

import { type RendererStats } from '../renderer/renderer.js';
import { useAppContext } from './context.jsx';
import classes from './style.module.scss';

export const Stats: FC = () => {
  const { renderer } = useAppContext();
  const [visible, setVisible] = useState(renderer.debug);
  const [stats, setStats] = useState<RendererStats | null>(null);

  useEffect(() => {
    setVisible(renderer.debug);

    return renderer.on('debugChanged', (debug) => {
      setVisible(debug);
    });
  }, [renderer]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(renderer.getStats());
    }, 500);

    return () => clearInterval(interval);
  }, [renderer]);

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
