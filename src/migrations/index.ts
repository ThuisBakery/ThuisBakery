import * as migration_20260922_171031 from './20260922_171031';
import * as migration_20260922_184217_catalogue_content_model from './20260922_184217_catalogue_content_model';

export const migrations = [
  {
    up: migration_20260922_171031.up,
    down: migration_20260922_171031.down,
    name: '20260922_171031',
  },
  {
    up: migration_20260922_184217_catalogue_content_model.up,
    down: migration_20260922_184217_catalogue_content_model.down,
    name: '20260922_184217_catalogue_content_model'
  },
];
