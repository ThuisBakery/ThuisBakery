import * as migration_20260922_171031 from './20260922_171031';

export const migrations = [
  {
    up: migration_20260922_171031.up,
    down: migration_20260922_171031.down,
    name: '20260922_171031'
  },
];
