import { type UserPublicData } from '@root/app/server/api/routers/specific/publicData';
import { api } from "app/trpc/server";

export const getUserFromApi = async ({ clientId }: { clientId: string }): Promise<UserPublicData | null> => {
    const userPublicData = await api.specific.publicData.get({
        id: clientId,
    }) ?? null;
    // if (!page) {
    //     throw new Error(`Page not found: ${key}`);
    // }
    // const { content, context } = page;
    // if (!validateContext(context)) {
    //     return page as T extends "page" ? Page : MdContent;
    // }

    // page.content = content.map(c => replaceVariables(c, { ...context }));
    return userPublicData;
};
