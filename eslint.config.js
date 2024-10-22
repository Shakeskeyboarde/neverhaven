import rational, { flatConfigBuilder } from 'eslint-config-rational';

export default flatConfigBuilder()
  .ignore('**/{dist,lib,out,coverage,.terraform}')
  .use(rational, {
    tsDevFiles: (defaults) => [...defaults, '**/*.data.ts'],
  })
  .build();
