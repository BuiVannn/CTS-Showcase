import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { fileURLToPath } from "url";

import { Users } from "./collections/Users";
import { Products } from "./collections/Products";
import { Team } from "./collections/Team";
import { Media } from "./collections/Media";
import { ContactSubmissions } from "./collections/ContactSubmissions";
import { SiteSettings } from "./globals/SiteSettings";
import { Partners } from "./globals/Partners";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  collections: [Users, Products, Team, Media, ContactSubmissions],
  globals: [SiteSettings, Partners],

  editor: lexicalEditor({}),

  localization: {
    locales: [
      { label: "English", code: "en" },
      { label: "Vietnamese", code: "vi" },
    ],
    defaultLocale: "en",
    fallback: true,
  },

  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || "file:./database.db",
    },
  }),

  secret: process.env.PAYLOAD_SECRET || "cts-lab-change-this-in-production",

  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },

  // Sharp for image processing
  sharp: undefined, // will be set dynamically
});
