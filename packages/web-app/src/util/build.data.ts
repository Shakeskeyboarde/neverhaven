import { $ } from 'execa';

export const buildTimestamp = Date.now();
export const buildCommit = await $`git rev-parse HEAD`.then((res) => res.stdout);
