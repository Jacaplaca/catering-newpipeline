import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import translate from '@root/app/lib/lang/translate';
import DocumentsComponent from '@root/app/specific/components/PublicData/Client/Documents/DocumentsComponent';
import { api } from '@root/app/trpc/server';
import { type FunctionComponent } from 'react';
import { auth } from '@root/app/server/auth';

const Documents: FunctionComponent<{
    lang: LocaleApp,
    pageName: string,
    clientId?: string
}> = async ({ lang, clientId }) => {
    const session = await auth();
    const clientFiles = await api.specific.clientFiles.asClient({ clientId });
    const [
        dictionary,
    ] = await Promise.all([
        getDictFromApi(lang, ["shared", "documents"]),
    ])

    if (!clientId) {
        return <div>{translate(dictionary, "documents:no_client")}</div>;
    }

    return (
        <DocumentsComponent
            clientId={clientId}
            clientFiles={clientFiles}
            dictionary={dictionary}
            lang={lang}
            session={session}
        />
    )
}

export default Documents;