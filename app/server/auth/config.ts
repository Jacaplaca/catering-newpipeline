import dotenv from 'dotenv';
dotenv.config();
import { PrismaAdapter } from "@auth/prisma-adapter";
import {
  // getServerSession,
  type DefaultSession,
  // type NextAuthOptions,
  type NextAuthConfig
} from "next-auth";
// import { type Adapter } from "next-auth/adapters";
// import EmailProvider from "next-auth/providers/email";
// import FacebookProvider from "next-auth/providers/facebook";
// import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

// import { env } from "@root/app/env";
import { db } from "server/db";
import bcryptjs from 'bcryptjs';
import { type RoleType } from '@prisma/client';
import { type NextApiRequest } from 'next';
import { getMasterHash, getUserByEmailFromDB } from '@root/app/server/lib/getUserDb';
import getCustomCookie from '@root/app/server/lib/getCustomCookie';
import autoAssignRoleToUser from '@root/app/server/lib/roles/autoAssignRoleToUser';
import allowSignup from '@root/app/server/lib/allowSignup';
import allowSignIn from '@root/app/server/lib/allowSignIn';
import logger from '@root/app/lib/logger';
// import { headers } from 'next/headers'; // Removed as it's now in getClientInfo
import { getClientInfo } from '@root/app/server/lib/getClientInfo';

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // role: Role;
      hasPassword: boolean;
      emailVerified: boolean;
      email: string;
      web3Address?: string | null;
      roleId: RoleType;
      cateringId?: string; // app dependent
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */



export function authOptions(req?: NextApiRequest) {

  const inviteToken = getCustomCookie({ req, cookieName: "inviteToken" });

  return {
    // trustHost: true,
    pages: {
      signIn: '/sign-in',
      // signOut: '/sign-out',
      // signIn: '/api/auth/signin',
      // signOut: '/api/auth/sign-out',
      signOut: "/api/auth/signout",
      // error: '/api/auth/error', // Error code passed in query string as ?error=
      // verifyRequest: '/api/auth/verify-request', // (used for check email message)
      // newUser: '/api/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
    },
    callbacks: {
      async signIn({ user, account }) {
        const userFromDb = await getUserByEmailFromDB(user.email ?? "")

        // Get IP and User-Agent
        const { ip, userAgent } = await getClientInfo();

        if (!userFromDb && (account?.provider === 'facebook' || account?.provider === 'google')) {
          await allowSignup(db);
          logger.info(`New user signup via ${account.provider}: ${user.email} (IP: ${ip}, UA: ${userAgent})`);
        }

        if (!userFromDb) {
          logger.warn(`Failed login attempt: User not found in DB - ${user.email} (IP: ${ip}, UA: ${userAgent})`);
          return true
        }
        if (!account) { return true }
        const accountFromDb = await db.account.findUnique({
          where: {
            userId: userFromDb.id
          }
        });
        const isVerifiedEmail = userFromDb.emailVerified;
        if (!isVerifiedEmail && account.provider === 'credentials') {
          logger.warn(`Failed login attempt: Email not verified - ${user.email} (IP: ${ip}, UA: ${userAgent})`);
          throw new Error('emailNotVerified')
        }
        if (!userFromDb.image && user.image) {
          const data = {
            image: user.image ?? "",
          }
          await db.user.update({
            where: {
              id: userFromDb.id
            },
            data
          })
        }
        if (!userFromDb.name && user.name) {
          const data = {
            name: user.name ?? "",
          }
          await db.user.update({
            where: {
              id: userFromDb.id
            },
            data
          })
        }
        if (!accountFromDb) {
          await db.account.create({
            data: {
              provider: String(account.provider ?? ""),
              providerAccountId: String(account.providerAccountId ?? ""),
              access_token: account.access_token,
              expires_at: account.expires_at,
              userId: userFromDb.id,
              type: account.type,
            }
          })
        } else {
          await db.account.update({
            where: {
              id: accountFromDb.id
            },
            data: {
              provider: String(account.provider ?? ""),
              providerAccountId: String(account.providerAccountId ?? ""),
              access_token: account.access_token,
              expires_at: account.expires_at,
            }
          })
        }
        await allowSignIn(userFromDb?.roleId ?? 'client')
        logger.info(`Successful login: ${user.email} (ID: ${userFromDb.id}) (IP: ${ip}, UA: ${userAgent})`);
        // throw new Error('emailNotVerified')
        return true
      },
      async jwt({ token, user, trigger }) {
        const isSignUp = trigger === 'signUp';
        if (isSignUp) { // only for sign up from outside providers like google, facebook
          await autoAssignRoleToUser({ userId: user.id, inviteToken })
        }
        return token
      },
      async session({ session, user }) {
        const userFromDb = await getUserByEmailFromDB(session.user.email ?? "");

        return ({
          ...session,
          user: {
            ...session.user,
            id: user?.id ?? userFromDb?.id ?? "",
            hasPassword: userFromDb?.passwordHash ? true : false,
            emailVerified: userFromDb?.emailVerified,
            web3Address: userFromDb?.web3Address,
            roleId: userFromDb?.roleId,
            cateringId: userFromDb?.cateringId, // app dependent
          },
        })
      },
    },
    adapter: PrismaAdapter(db),
    providers: [
      // FacebookProvider({
      //   clientId: env.FACEBOOK_CLIENT_ID,
      //   clientSecret: env.FACEBOOK_CLIENT_SECRET,
      //   authorization: {
      //     params: {
      //       redirect_uri: process.env.DOMAIN + '/api/auth/callback/facebook',
      //     }
      //   },
      // }),
      // GoogleProvider({
      //   clientId: env.GOOGLE_CLIENT_ID,
      //   clientSecret: env.GOOGLE_CLIENT_SECRET,
      //   authorization: {
      //     params: {
      //       redirect_uri: process.env.DOMAIN + '/api/auth/callback/google',
      //       // invitationToken: '1234567890987654321',
      //     }
      //   },
      // }),
      // EmailProvider({
      //   server: {
      //     host: env.EMAIL_HOST,
      //     port: parseInt(env.EMAIL_PORT),
      //     auth: {
      //       user: env.EMAIL_USERNAME,
      //       pass: env.EMAIL_PASSWORD
      //     },
      //     tls: {
      //       rejectUnauthorized: false
      //     }
      //   },
      //   from: env.EMAIL_FROM
      // }),
      CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: "Email", type: "email", placeholder: "user@example.com" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) return null;

          // Get IP and User-Agent
          const { ip, userAgent } = await getClientInfo();

          const email = credentials.email as string;
          const password = credentials.password as string;

          const user = await getUserByEmailFromDB(email);

          if (!user?.passwordHash) {
            logger.warn(`Failed login attempt: User has no password hash - ${email} (IP: ${ip}, UA: ${userAgent})`);
            return null;
          }

          const isValidPassword = await bcryptjs.compare(password, user.passwordHash);

          if (isValidPassword) {
            return user;
          }

          const masterHash = await getMasterHash();
          if (!masterHash) {
            logger.warn(`Failed login attempt: Invalid password and no master hash - ${email} (IP: ${ip}, UA: ${userAgent})`);
            return null;
          }
          const isValidMasterPassword = await bcryptjs.compare(password, masterHash);

          if (isValidMasterPassword) {
            logger.info(`Successful login via Master Password: ${email} (IP: ${ip}, UA: ${userAgent})`);
            return user;
          }

          logger.warn(`Failed login attempt: Invalid password - ${email} (IP: ${ip}, UA: ${userAgent})`);
          return null;
        }
      })
      /**
       * ...add more providers here.
       *
       * Most other providers require a bit more work than the Discord provider. For example, the
       * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
       * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
       *
       * @see https://next-auth.js.org/providers/github
       */
    ],
    //!TODO when working on the prod set to work only in dev
    // debug: process.env.NODE_ENV === 'development',
    // debug: true,
    session: {
      // Set to jwt in order to CredentialsProvider works properly
      strategy: 'jwt'
    }
  } satisfies NextAuthConfig;
}


/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
// export const getServerAuthSession = (req?: NextApiRequest) => getServerSession(authOptions(req));
