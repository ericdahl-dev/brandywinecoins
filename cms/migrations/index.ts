import * as migration_20260803_164903_initial from './20260803_164903_initial';

export const migrations = [
  {
    up: migration_20260803_164903_initial.up,
    down: migration_20260803_164903_initial.down,
    name: '20260803_164903_initial'
  },
];
