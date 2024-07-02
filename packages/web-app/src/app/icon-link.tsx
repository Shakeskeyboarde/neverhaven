import { type ComponentPropsWithoutRef, type FC } from 'react';

import classes from './style.module.scss';

/**
 * A link that contains an icon.
 */
export const IconLink: FC<ComponentPropsWithoutRef<'a'>> = ({ children, className = '', ...props }) => {
  return <a {...props} className={`${className} ${classes.iconLink} ${classes.interactive}`}>{children}</a>;
};
