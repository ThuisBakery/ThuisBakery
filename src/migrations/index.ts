import * as migration_20260922_171031 from './20260922_171031';
import * as migration_20260922_184217_catalogue_content_model from './20260922_184217_catalogue_content_model';
import * as migration_20260922_190506_header_footer from './20260922_190506_header_footer';
import * as migration_20260922_190518_seed_header_footer from './20260922_190518_seed_header_footer';
import * as migration_20260922_194044_category_menu from './20260922_194044_category_menu';
import * as migration_20260923_041942_home_page from './20260923_041942_home_page';
import * as migration_20260923_041950_seed_home from './20260923_041950_seed_home';
import * as migration_20260923_050411_submissions from './20260923_050411_submissions';
import * as migration_20260923_055735_submission_reference from './20260923_055735_submission_reference';
import * as migration_20260923_061024_marketing_pages from './20260923_061024_marketing_pages';
import * as migration_20260923_182011_seo_meta from './20260923_182011_seo_meta';
import * as migration_20260923_183830_enquiry_delivery from './20260923_183830_enquiry_delivery';
import * as migration_20260923_191002_about_contact_privacy_pages from './20260923_191002_about_contact_privacy_pages';
import * as migration_20260923_191019_seed_about_contact_privacy from './20260923_191019_seed_about_contact_privacy';
import * as migration_20260923_200000_seed_placeholder_catalogue from './20260923_200000_seed_placeholder_catalogue';

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
  {
    up: migration_20260923_050411_submissions.up,
    down: migration_20260923_050411_submissions.down,
    name: '20260923_050411_submissions',
  },
  {
    up: migration_20260923_055735_submission_reference.up,
    down: migration_20260923_055735_submission_reference.down,
    name: '20260923_055735_submission_reference',
  },
  {
    up: migration_20260923_061024_marketing_pages.up,
    down: migration_20260923_061024_marketing_pages.down,
    name: '20260923_061024_marketing_pages',
  },
  {
    up: migration_20260923_182011_seo_meta.up,
    down: migration_20260923_182011_seo_meta.down,
    name: '20260923_182011_seo_meta',
  },
  {
    up: migration_20260923_183830_enquiry_delivery.up,
    down: migration_20260923_183830_enquiry_delivery.down,
    name: '20260923_183830_enquiry_delivery',
  },
  {
    up: migration_20260923_191002_about_contact_privacy_pages.up,
    down: migration_20260923_191002_about_contact_privacy_pages.down,
    name: '20260923_191002_about_contact_privacy_pages',
  },
  {
    up: migration_20260923_191019_seed_about_contact_privacy.up,
    down: migration_20260923_191019_seed_about_contact_privacy.down,
    name: '20260923_191019_seed_about_contact_privacy',
  },
  {
    up: migration_20260923_200000_seed_placeholder_catalogue.up,
    down: migration_20260923_200000_seed_placeholder_catalogue.down,
    name: '20260923_200000_seed_placeholder_catalogue'
  },
];
