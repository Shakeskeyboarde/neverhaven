import { type FC, useEffect, useState } from 'react';

import { type RendererStats } from '../renderer/renderer.js';
import { buildCommit, buildTimestamp } from '../util/build.data.js';
import { useAppContext } from './context.js';
import classes from './style.module.scss';

export const Debug: FC = () => {
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
    <div className={classes.debug}>
      <div>Build</div>
      <ul className={classes.plainList}>
        <li>
          {`Date: ${new Date(buildTimestamp).toLocaleDateString()}`}
        </li>
        <li>
          {`Time: ${new Date(buildTimestamp).toLocaleTimeString()}`}
        </li>
        <li>
          {`Commit: ${buildCommit.slice(0, 8)}`}
        </li>
      </ul>
      <div>Renderer</div>
      <ul className={classes.plainList}>
        <li>
          {`FPS: ${stats?.fps ?? 0}`}
        </li>
        <li>
          {`Frame: ${stats?.frame ?? 0}`}
        </li>
        <li>
          {`Time: ${getTimeString(stats?.timeMs ?? 0)}`}
        </li>
        <li>
          {`Calls: ${stats?.calls ?? 0}`}
        </li>
        <li>
          {`Triangles: ${stats?.triangles ?? 0}`}
        </li>
        <li>
          {`Lines: ${stats?.lines ?? 0}`}
        </li>
        <li>
          {`Points: ${stats?.points ?? 0}`}
        </li>
      </ul>
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
