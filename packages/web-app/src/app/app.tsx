import { type FC } from 'react';

import { type AppContext, AppContextProvider } from './context.js';
import { Debug } from './debug.jsx';
import { Menubar } from './menubar.jsx';

export const App: FC<AppContext> = (props) => {
  return (
    <AppContextProvider {...props}>
      <Debug />
      <Menubar />
    </AppContextProvider>
  );
};
