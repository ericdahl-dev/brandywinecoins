import * as migration_20260803_164903_initial from './20260803_164903_initial';
import * as migration_20260803_170241_about_global from './20260803_170241_about_global';
import * as migration_20260803_170500_seed_about from './20260803_170500_seed_about';
import * as migration_20260803_180947_about_one_field from './20260803_180947_about_one_field';

export const migrations = [
  {
    up: migration_20260803_164903_initial.up,
    down: migration_20260803_164903_initial.down,
    name: '20260803_164903_initial',
  },
  {
    up: migration_20260803_170241_about_global.up,
    down: migration_20260803_170241_about_global.down,
    name: '20260803_170241_about_global',
  },
  {
    up: migration_20260803_170500_seed_about.up,
    down: migration_20260803_170500_seed_about.down,
    name: '20260803_170500_seed_about',
  },
  {
    up: migration_20260803_180947_about_one_field.up,
    down: migration_20260803_180947_about_one_field.down,
    name: '20260803_180947_about_one_field'
  },
];
