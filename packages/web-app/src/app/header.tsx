import { type FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useAppContext } from './context.jsx';
import classes from './style.module.scss';

export const Header: FC = () => {
  const { header, state } = useAppContext();
  const [warnings, setWarnings] = useState<readonly string[]>([]);

  useEffect(() => {
    const update = (): void => {
      if (!state.capabilities) {
        setWarnings([]);
        return;
      }

      const newWarnings: string[] = [];

      if (!state.capabilities.db) {
        newWarnings.push('IndexedDB access is not available. You will lose your progress if you navigate away from this page.');
      }

      setWarnings(newWarnings);
    };

    update();

    return state.on('initializeSuccess', update, { once: true });
  }, [state]);

  return createPortal(
    <ul className={classes.header}>
      {warnings.map((warning, i) => {
        return <li className={classes.warn} key={i}>{warning}</li>;
      })}
    </ul>,
    header,
  );
};
