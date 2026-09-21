import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  // Email and password come from `auth: true`. Jana is the only user.
  fields: [],
}
