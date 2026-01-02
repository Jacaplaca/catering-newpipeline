import toBool from '@root/app/lib/toBool';
import { i18n } from '@root/i18n-config';
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const getDbUrl = () => {
  // if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
  //   // const prodDb = `mongodb://${process.env.MONGO_INITDB_DATABASE_USERNAME}:${process.env.MONGO_INITDB_DATABASE_PASSWORD}@${process.env.MONGO_INITDB_SERVICE_NAME}:${process.env.MONGO_INITDB_DATABASE_PORT_INTERNAL}/${process.env.MONGO_INITDB_DATABASE_NAME}?authSource=${process.env.MONGO_INITDB_DATABASE_NAME}&replicaSet=rs0`;
  //   // console.log("🚀 ~ getDbUrl ~ prodDb:", prodDb)
  //   return process.env.DATABASE_URL;
  // } else if (process.env.NODE_ENV === "production") {
  //   //should working on local machine with docker
  //   return `mongodb://host.docker.internal:27017/t3?authSource=t3&replicaSet=rs0`;
  //   // should working on remote server with docker
  //   // return `mongodb://${process.env.MONGO_INITDB_DATABASE_USERNAME}:${process.env.MONGO_INITDB_DATABASE_PASSWORD}@${process.env.MONGO_INITDB_SERVICE_NAME}:${process.env.MONGO_INITDB_DATABASE_PORT_INTERNAL}/${process.env.MONGO_INITDB_DATABASE_NAME}?authSource=${process.env.MONGO_INITDB_DATABASE_NAME}`;
  //   // working on local machine without docker
  //   // return `mongodb://${process.env.MONGO_INITDB_DATABASE_USERNAME}:${process.env.MONGO_INITDB_DATABASE_PASSWORD}@${process.env.MONGO_INITDB_SERVICE_NAME}:${process.env.MONGO_INITDB_DATABASE_PORT_INTERNAL}/${process.env.MONGO_INITDB_DATABASE_NAME}?authSource=${process.env.MONGO_INITDB_DATABASE_NAME}&replicaSet=rs0`;
  // }
  // // return `mongodb://${process.env.MONGO_INITDB_DATABASE_USERNAME}:${process.env.MONGO_INITDB_DATABASE_PASSWORD}@${process.env.MONGO_INITDB_SERVICE_NAME}:${process.env.MONGO_INITDB_DATABASE_PORT_INTERNAL}/${process.env.MONGO_INITDB_DATABASE_NAME}?authSource=${process.env.MONGO_INITDB_DATABASE_NAME}&replicaSet=rs0`;
  return process.env.DATABASE_URL;
};

// const getDomain = () => {
//   // console.log("process.env", process.env)
//   if (process.env.NODE_ENV === "development") {
//     return `${process.env.DOMAIN_DEV}:${process.env.API_PORT_INTERNAL}`;
//   } else if (process.env.NODE_ENV === "production") {
//     // return process.env.DOMAIN_PROD;
//     return "http://localhost" + ":" + process.env.API_PORT_EXTERNAL;
//   }
// };

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    APP_VERSION: z.string().default("0.0.0"),
    DATABASE_URL: z
      .string()
      .url()
      .refine(
        (str) => !str.includes("YOUR_MYSQL_URL_HERE"),
        "You forgot to change the default URL"
      ),
    APP_NAME: z.string(),
    PORT: z.string(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PRISMA_LOG: z.enum(["yes", "no"]).default("no"),
    RESET: z.enum(["yes", "no"]).default("no"),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    DOMAIN: z.string().url(),
    // DOMAIN_DEV: z.preprocess(
    //   // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
    //   // Since NextAuth.js automatically uses the VERCEL_URL if present.
    //   (str) => process.env.VERCEL_URL ?? str,
    //   // VERCEL_URL doesn't include `https` so it cant be validated as a URL
    //   process.env.VERCEL ? z.string() : z.string().url()
    // ),
    // DOMAIN_PROD: z.preprocess(
    //   // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
    //   // Since NextAuth.js automatically uses the VERCEL_URL if present.
    //   (str) => process.env.VERCEL_URL ?? str,
    //   // VERCEL_URL doesn't include `https` so it cant be validated as a URL
    //   process.env.VERCEL ? z.string() : z.string().url()
    // ),
    // PORT: z.string().optional(),
    // Add ` on ID and SECRET if you want to make sure they're not empty
    FACEBOOK_CLIENT_ID: z.string(),
    FACEBOOK_CLIENT_SECRET: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    EMAIL_HOST: z.string(),
    EMAIL_PORT: z.string(),
    EMAIL_USERNAME: z.string(),
    EMAIL_PASSWORD: z.string(),
    EMAIL_FROM: z.string(),
    EMAIL_FROM_ACTIVATION: z.string(),
    EMAIL_CONTACT_ADMIN: z.string(),
    // APP_VERSION: z.string(),
    DEFAULT_LOCALE: z.enum(i18n.locales),
    GOOGLE_ANALYTICS_ID: z.string(),
    S3_WEB_ENDPOINT: z.string(),
    S3_CLIENT_ENDPOINT: z.string(),
    S3_SERVER_ENDPOINT: z.string(),
    S3_REGION: z.string(),
    S3_BUCKET: z.string(),
    S3_KEY_ID: z.string(),
    S3_KEY_SECRET: z.string(),
    // BACKUP_CRON: z.string(),
    // BACKUP_KEEP: z.string(),
    AUTH_TRUST_HOST: z.string(),
    MAIN_PAGE_REDIRECT: z.string()
      .optional()
      .transform(val => toBool(val)),
    DEV_TOOLS_LOG: z.string().optional().transform(val => toBool(val)),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
  */
  client: {
    NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(i18n.locales),
    NEXT_PUBLIC_DOMAIN: z.string(),
    NEXT_PUBLIC_MAIN_PAGE_REDIRECT: z.string()
      .optional()
      .transform(val => toBool(val)),
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
    NEXT_PUBLIC_MENU_FRONT: z.string()
      .optional()
      .transform(val => toBool(val)),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    APP_VERSION: process.env.APP_VERSION ?? process.env.npm_package_version,
    DATABASE_URL: getDbUrl(),
    NODE_ENV: process.env.NODE_ENV,
    APP_NAME: process.env.APP_NAME,
    PORT: process.env.PORT,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DOMAIN: process.env.DOMAIN,
    RESET: process.env.RESET,
    // DOMAIN_DEV: `${process.env.DOMAIN_DEV}:${process.env.API_PORT_INTERNAL}`,
    // DOMAIN_PROD: process.env.DOMAIN_PROD,
    // PORT: process.env.PORT,
    FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
    FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_USERNAME: process.env.EMAIL_USERNAME,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_FROM_ACTIVATION: process.env.EMAIL_FROM_ACTIVATION,
    EMAIL_CONTACT_ADMIN: process.env.EMAIL_CONTACT_ADMIN,
    PRISMA_LOG: process.env.PRISMA_LOG,
    // APP_VERSION: process.env.npm_package_version,
    DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
    GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID,
    S3_WEB_ENDPOINT: process.env.S3_WEB_ENDPOINT,
    S3_CLIENT_ENDPOINT: process.env.S3_CLIENT_ENDPOINT,
    S3_SERVER_ENDPOINT: process.env.S3_SERVER_ENDPOINT,
    S3_REGION: process.env.S3_REGION,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_KEY_ID: process.env.S3_KEY_ID,
    S3_KEY_SECRET: process.env.S3_KEY_SECRET,
    // BACKUP_CRON: process.env.BACKUP_CRON,
    // BACKUP_KEEP: process.env.BACKUP_KEEP,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    MAIN_PAGE_REDIRECT: process.env.NEXT_PUBLIC_MAIN_PAGE_REDIRECT,
    NEXT_PUBLIC_MAIN_PAGE_REDIRECT: process.env.NEXT_PUBLIC_MAIN_PAGE_REDIRECT,
    NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN,
    NEXT_PUBLIC_MENU_FRONT: process.env.NEXT_PUBLIC_MENU_FRONT,
    DEV_TOOLS_LOG: process.env.DEV_TOOLS_LOG,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
