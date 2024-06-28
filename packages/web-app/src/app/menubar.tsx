import { IconBrandGithub, IconBrandWordpress } from '@tabler/icons-react';
import type { FC } from 'react';

import { IconLink } from './icon-link.jsx';
import classes from './style.module.scss';

export const Menubar: FC = () => {
  return (
    <div className={classes.menubar}>
      <IconLink href="https://incomplete.quest/category/neverhaven/" target="_blank" title="Wordpress"><IconBrandWordpress /></IconLink>
      <IconLink href="https://github.com/Shakeskeyboarde/neverhaven" target="_blank" title="Github"><IconBrandGithub /></IconLink>
    </div>
  );
};
