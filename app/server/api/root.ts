import { createCallerFactory, createTRPCRouter } from "server/api/trpc";
import { userRouter } from "server/api/routers/user";
import { devRouter } from "server/api/routers/dev";
import { articleRouter } from '@root/app/server/api/routers/article';
import { navigationRouter } from '@root/app/server/api/routers/navigation';
import { translationRouter } from '@root/app/server/api/routers/translation';
import { settingsRouter } from '@root/app/server/api/routers/settings';
import { pageRouter } from '@root/app/server/api/routers/pages';
import { contactRouter } from '@root/app/server/api/routers/contact';
import { healthRouter } from '@root/app/server/api/routers/health';
import { sitemapRouter } from '@root/app/server/api/routers/sitemaps';
import { mdContentRouter } from '@root/app/server/api/routers/mdContent';
import { roleRouter } from '@root/app/server/api/routers/role';
import { tokenRouter } from '@root/app/server/api/routers/token';
import { awsRouter } from '@root/app/server/api/routers/aws';
import { clipboardRouter } from '@root/app/server/api/routers/clipboard';
import specificRouter from '@root/app/server/api/routers/specific';
import initAutoOrderCron from '@root/app/server/lib/autoOrder';
import initBackupCron from '@root/app/server/lib/makeBackup/backup';
import initCleanupCronMenu from '@root/app/server/lib/cleanup/menu';
import initCleanupCronOrders from '@root/app/server/lib/cleanup/orders';
import initCleanupCronClientFiles from '@root/app/server/lib/cleanup/clientFiles';

// void initAutoOrderCron();
// void initBackupCron();
// void initCleanupCronMenu();
// void initCleanupCronOrders();
// void initCleanupCronClientFiles();

// void '@root/app/server/lib/autoOrder';
// void '@root/app/server/lib/makeBackup/backup';
// void '@root/app/server/lib/cleanup/menu';
// void '@root/app/server/lib/cleanup/orders';
// void '@root/app/server/lib/cleanup/clientFiles';

export const appRouter = createTRPCRouter({
  article: articleRouter,
  user: userRouter,
  dev: devRouter,
  navigation: navigationRouter,
  translation: translationRouter,
  settings: settingsRouter,
  page: pageRouter,
  contact: contactRouter,
  health: healthRouter,
  siteMap: sitemapRouter,
  mdContent: mdContentRouter,
  role: roleRouter,
  token: tokenRouter,
  aws: awsRouter,
  clipboard: clipboardRouter,
  privateSettings: {
    hasFinished: specificRouter.settings.hasFinished
  },
  personalization: { get: specificRouter.settings.get },
  specific: specificRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
