import { createContext, type FC, type PropsWithChildren, useContext } from 'react';

import type { Renderer } from '../renderer/renderer.js';
import type { GameState } from '../state/state.js';

export interface AppContext {
  readonly renderer: Renderer;
  readonly state: GameState;
  readonly header: HTMLElement;
}

const Context = createContext<AppContext | null>(null);

export const AppContextProvider: FC<PropsWithChildren<AppContext>> = ({ children, ...value }) => {
  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useAppContext = (): AppContext => {
  const current = useContext(Context);

  if (!current) {
    throw new Error('missing app context');
  }

  return current;
};
