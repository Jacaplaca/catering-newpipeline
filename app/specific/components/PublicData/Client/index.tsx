import Documents from '@root/app/specific/components/PublicData/Client/Documents';
// import ConsumerList from '@root/app/specific/components/PublicData/Client/ConsumerList';
import { type FC } from 'react';
// import getDictFromApi from '@root/app/lib/lang/getDictFromApi';

const ClientPublicData: FC<{ clientId: string, lang: LocaleApp, pageName: string }> = ({ clientId, lang, pageName }) => {

    // const dictionary = await getDictFromApi(lang, ["public-profile", "shared"])
    // max-w-7xl mx-auto dark:bg-neutral-800/30 rounded-lg p-6
    return <div className='' >
        <Documents
            lang={lang}
            clientId={clientId}
            pageName={pageName}
        />
        <div className='border-t border-neutral-200 dark:border-neutral-700 my-6 w-full'> </div>
        {/* <ConsumerList clientId={clientId} lang={lang} dictionary={dictionary} /> */}
    </div>
}

export default ClientPublicData;