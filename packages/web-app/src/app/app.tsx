import { type FC } from 'react';

import { type AppContext, AppContextProvider } from './context.js';
import { Menubar } from './menubar.jsx';
import { Stats } from './stats.js';

export const App: FC<AppContext> = (props) => {
  return (
    <AppContextProvider {...props}>
      <Stats />
      <Menubar />
    </AppContextProvider>
  );
};
