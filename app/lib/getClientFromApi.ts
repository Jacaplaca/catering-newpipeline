import { api } from "app/trpc/server";

export const getClientFromApi = async ({ clientId }: { clientId: string }): Promise<string> => {
    const clientName = await api.specific.client.getPublic({
        id: clientId,
    }) ?? '';
    // if (!page) {
    //     throw new Error(`Page not found: ${key}`);
    // }
    // const { content, context } = page;
    // if (!validateContext(context)) {
    //     return page as T extends "page" ? Page : MdContent;
    // }

    // page.content = content.map(c => replaceVariables(c, { ...context }));
    return clientName;
};
