import { type RoleType } from '@prisma/client';
import DashboardItemWrapper from '@root/app/_components/Dashboard/ItemWrapper';
import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import translate from '@root/app/lib/lang/translate';
import { auth } from '@root/app/server/auth';
import { type ReactNode } from 'react';

interface SettingsWrapperProps {
    lang: LocaleApp;
    clientId?: string;
    renderComponent: (props: {
        roleId?: RoleType;
        dictionary: Record<string, string>;
        clientId?: string;
        lang: LocaleApp
    }) => ReactNode;
}

const SettingsWrapper = async ({ lang, renderComponent, clientId }: SettingsWrapperProps) => {
    const dictionary = await getDictFromApi(lang, ["shared", "settings"]);
    const session = await auth();

    return (
        <DashboardItemWrapper
            title={translate(dictionary, 'settings:title')}
            className='max-w-screen-xl'
        >
            {renderComponent({ roleId: session?.user?.roleId, dictionary, clientId, lang })}
        </DashboardItemWrapper>
    );
};

export default SettingsWrapper;
