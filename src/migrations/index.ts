import * as migration_20260922_171031 from './20260922_171031';
import * as migration_20260922_184217_catalogue_content_model from './20260922_184217_catalogue_content_model';
import * as migration_20260922_190506_header_footer from './20260922_190506_header_footer';
import * as migration_20260922_190518_seed_header_footer from './20260922_190518_seed_header_footer';
import * as migration_20260922_194044_category_menu from './20260922_194044_category_menu';
import * as migration_20260923_041942_home_page from './20260923_041942_home_page';
import * as migration_20260923_041950_seed_home from './20260923_041950_seed_home';

export const migrations = [
  {
    up: migration_20260922_171031.up,
    down: migration_20260922_171031.down,
    name: '20260922_171031',
  },
  {
    up: migration_20260922_184217_catalogue_content_model.up,
    down: migration_20260922_184217_catalogue_content_model.down,
    name: '20260922_184217_catalogue_content_model',
  },
  {
    up: migration_20260922_190506_header_footer.up,
    down: migration_20260922_190506_header_footer.down,
    name: '20260922_190506_header_footer',
  },
  {
    up: migration_20260922_190518_seed_header_footer.up,
    down: migration_20260922_190518_seed_header_footer.down,
    name: '20260922_190518_seed_header_footer',
  },
  {
    up: migration_20260922_194044_category_menu.up,
    down: migration_20260922_194044_category_menu.down,
    name: '20260922_194044_category_menu',
  },
  {
    up: migration_20260923_041942_home_page.up,
    down: migration_20260923_041942_home_page.down,
    name: '20260923_041942_home_page',
  },
  {
    up: migration_20260923_041950_seed_home.up,
    down: migration_20260923_041950_seed_home.down,
    name: '20260923_041950_seed_home',
  },
];
