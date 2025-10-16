
import { type RoleType } from '@prisma/client';
import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import ClientPublicData from '@root/app/specific/components/PublicData/Client';
import ConsumerPublicData from '@root/app/specific/components/PublicData/Consumer';
import { type FC } from 'react';

const PublicData: FC<{ id: string, role: RoleType & 'consumer', lang: LocaleApp, pageName: string }> = async ({ id, role, lang, pageName }) => {
    const [
        dictionary,
    ] = await Promise.all([
        getDictFromApi(lang, ["shared", "public-profile"]),
    ])
    return role === 'client'
        ? <ClientPublicData
            clientId={id}
            lang={lang}
            pageName={pageName}
        />
        : <ConsumerPublicData id={id} lang={lang} dictionary={dictionary} />
}

export default PublicData;