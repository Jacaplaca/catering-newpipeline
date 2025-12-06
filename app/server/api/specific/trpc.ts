import { TRPCError } from "@trpc/server";
import { db } from '@root/app/server/db';
import { allowActiveApp, t, timingMiddleware } from '@root/app/server/api/trpc';
import { type RoleType } from '@prisma/client';
import hasFinishedSettings from '@root/app/server/api/routers/specific/libs/hasFinishedSettings';
import { type Session } from "next-auth"; // Zakładając, że używasz next-auth
import { type Catering } from "@prisma/client";

export interface ExtendedSession extends Session {
    user: Session['user'] & {
        roleId: string;
        cateringId: string;
    };
    catering: Catering;
}

export interface Context {
    session: ExtendedSession;
    db: typeof db;
}

const enforceUserHasCatering = ({
    allowedRoles,
    expectSettings = true,
    ignoreAuth = false,
}: {
    allowedRoles?: RoleType[] | RoleType
    expectSettings?: boolean
    ignoreAuth?: boolean
}) => {
    return t.middleware(async ({ ctx, next }) => {

        if (!ctx.session || !ctx.session.user) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const userRole = ctx.session.user.roleId;

        if (allowedRoles) {
            if (!allowedRoles.includes(userRole)) {
                throw new TRPCError({ code: "FORBIDDEN" });
            }
        }

        const cateringId = ctx.session.user.cateringId;

        if (cateringId == null) {
            throw new TRPCError({ code: "FORBIDDEN" });
        }

        if (typeof cateringId !== "string") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid cateringId" });
        }

        const catering = await db.catering.findUnique({
            where: { id: cateringId },
        });

        if (!catering) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Catering not found" });
        }

        const finishedSettings = expectSettings
            ? await hasFinishedSettings({
                roleId: userRole,
                userId: ctx.session.user.id,
                catering,
            })
            : true;

        if (!finishedSettings) {
            throw new TRPCError({ code: "FORBIDDEN", message: "User settings not finished" });
        }

        return next({
            ctx: {
                session: { ...ctx.session, user: ctx.session.user, catering },
            },
        });
    });
};

export const createCateringProcedure = (allowedRoles: RoleType[]) => {
    return t.procedure
        .use(allowActiveApp)
        .use(timingMiddleware)
        .use(enforceUserHasCatering({ allowedRoles, expectSettings: true }))
        .use(({ ctx, next }) => {
            const typedCtx: Context = ctx as Context;
            return next({ ctx: typedCtx });
        });
};

export const createCateringNotSettingsProcedure = (allowedRoles: RoleType[]) => {
    return t.procedure
        .use(allowActiveApp)
        .use(timingMiddleware)
        .use(enforceUserHasCatering({ allowedRoles, expectSettings: false }));
};

const optionalUserCatering = ({
    allowedRoles,
    expectSettings = false,
}: {
    allowedRoles?: RoleType[] | RoleType
    expectSettings?: boolean
} = {}) => {
    return t.middleware(async ({ ctx, next }) => {
        // If no session, just pass through without error
        if (!ctx.session || !ctx.session.user) {
            return next({
                ctx: {
                    ...ctx,
                    session: { ...ctx.session, catering: { id: null } },
                    catering: null,
                },
            });
        }

        const userRole = ctx.session.user.roleId;

        // Check allowed roles if specified
        if (allowedRoles) {
            const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
            if (!rolesArray.includes(userRole)) {
                // User is logged in but doesn't have permission - pass through without catering
                return next({
                    ctx: {
                        ...ctx,
                        session: { ...ctx.session, catering: { id: null } },
                        catering: null,
                    },
                });
            }
        }

        const cateringId = ctx.session.user.cateringId;

        // If no cateringId, pass through without catering
        if (cateringId == null || typeof cateringId !== "string") {
            return next({
                ctx: {
                    ...ctx,
                    session: { ...ctx.session, catering: { id: null } },
                    catering: null,
                },
            });
        }

        const catering = await db.catering.findUnique({
            where: { id: cateringId },
        });

        // If catering not found, pass through without it
        if (!catering) {
            return next({
                ctx: {
                    ...ctx,
                    session: { ...ctx.session, catering: { id: null } },
                    catering: null,
                },
            });
        }

        // Check settings if required
        if (expectSettings) {
            const finishedSettings = await hasFinishedSettings({
                roleId: userRole,
                userId: ctx.session.user.id,
                catering,
            });

            if (!finishedSettings) {
                return next({
                    ctx: {
                        ...ctx,
                        session: { ...ctx.session, catering: { id: null } },
                        catering: null,
                    },
                });
            }
        }

        // User is authenticated and has catering - return full context
        return next({
            ctx: {
                session: { ...ctx.session, user: ctx.session.user, catering },
                catering,
            },
        });
    });
};

export const createOptionalCateringProcedure = (allowedRoles?: RoleType[]) => {
    return t.procedure
        .use(allowActiveApp)
        .use(timingMiddleware)
        .use(optionalUserCatering({ allowedRoles, expectSettings: false }));
};