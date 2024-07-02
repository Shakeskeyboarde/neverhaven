import { type FC } from 'react';

import { type AppContext, AppContextProvider } from './context.js';
import { Debug } from './debug.jsx';
import { Header } from './header.jsx';
import { Menubar } from './menubar.jsx';
import classes from './style.module.scss';

export const App: FC<AppContext> = (props) => {
  return (
    <AppContextProvider {...props}>
      <div className={classes.app}>
        <Header />
        <Debug />
        <Menubar />
      </div>
    </AppContextProvider>
  );
};
