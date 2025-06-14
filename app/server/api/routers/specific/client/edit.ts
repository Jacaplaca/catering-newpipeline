import { RoleType } from '@prisma/client';
import { createCateringProcedure } from '@root/app/server/api/specific/trpc';
import { clientEditValidator } from '@root/app/validators/specific/client';

const edit = createCateringProcedure([RoleType.manager])
    .input(clientEditValidator)
    .mutation(async ({ ctx, input }) => {
        const { db, session } = ctx
        const { id, name, email, address, city, contactPerson, country, notes, phone, zip, code, firstOrderDeadline, secondOrderDeadline, allowWeekendOrder, deliveryRoute } = input;
        const { cateringId } = session.user;
        const { settings } = session.catering

        if (!cateringId) {
            throw new Error("Catering ID is missing");
        }

        const client = await db.client.findUnique({
            where: {
                id,
                cateringId
            }
        });

        if (!client) {
            throw new Error("clients:already_removed");
        }


        // await db.tagClient.deleteMany({
        //     where: {
        //         clientId: id,
        //     },
        // });


        // if (tags.length) {
        //     const currentTags = await db.tag.findMany({
        //         where: {
        //             cateringId,
        //         },
        //     });

        //     const tagsToCreate = tags.filter((tag) => !currentTags.some((currentTag) => currentTag.name === tag))
        //         .map((name) => ({ name, cateringId, type: "client" }))
        //         .filter((tag) => tag.cateringId) as { name: string, cateringId: string, type: TagType }[];

        //     tagsToCreate.length && await db.tag.createMany({
        //         data: tagsToCreate,
        //     });

        //     const tagsToAddForClient = await db.tag.findMany({
        //         where: {
        //             name: {
        //                 in: tags,
        //             },
        //         },
        //         select: {
        //             id: true,
        //         },
        //     });

        //     tagsToAddForClient.length && await db.tagClient.createMany({
        //         data: tagsToAddForClient.map((tag) => ({
        //             clientId: id,
        //             tagId: tag.id,
        //         })),
        //     });
        // }

        if (code) {
            const clientWithCode = await db.client.findFirst({
                where: {
                    cateringId,
                    info: {
                        is: {
                            code: code.trim().toUpperCase(),
                        },
                    },
                    id: {
                        not: id,
                    },
                },
            });

            if (clientWithCode) {
                throw new Error("clients:duplicate_code_error");
            }
        }

        const info = {
            name, email, address, city, contactPerson, country, notes, phone, zip,
            code: code ? code.trim().toUpperCase() : undefined,
            firstOrderDeadline: "",
            secondOrderDeadline: "",
            allowWeekendOrder: allowWeekendOrder ?? false
        };

        if (firstOrderDeadline && firstOrderDeadline !== settings.firstOrderDeadline) {
            info.firstOrderDeadline = firstOrderDeadline;
        }

        if (firstOrderDeadline === settings.firstOrderDeadline) {
            info.firstOrderDeadline = "";
        }

        if (secondOrderDeadline && secondOrderDeadline !== settings.secondOrderDeadline) {
            info.secondOrderDeadline = secondOrderDeadline;
        }

        if (secondOrderDeadline === settings.secondOrderDeadline) {
            info.secondOrderDeadline = "";
        }

        return db.client.update({
            where: { id, cateringId },
            data: {
                info: {
                    update: info
                },
                deliveryRouteId: deliveryRoute?.id ?? null,
            }
        });
    })

export default edit;