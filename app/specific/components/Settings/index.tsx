import { type RoleType } from '@prisma/client';
import SettingsWrapper from '@root/app/_components/Dashboard/Settings/Wrapper';
import SuperAdmin from '@root/app/_components/Dashboard/SuperAdmin';
// import LogoUpload from '@root/app/_components/Upload/Logo';
// import translate from '@root/app/lib/lang/translate';
import ClientSettings from '@root/app/specific/components/Settings/Client';
import DieticianSettings from '@root/app/specific/components/Settings/Dietician';
import KitchenSettings from '@root/app/specific/components/Settings/Kitchen';
import ManagerSettings from '@root/app/specific/components/Settings/Manager';
import { type FunctionComponent } from 'react';

const renderSettingsComponent = ({
    roleId,
    dictionary,
    clientId,
    lang
}: {
    roleId?: RoleType
    dictionary: Record<string, string>
    clientId?: string
    lang: LocaleApp
}) => {
    switch (roleId) {
        case 'manager':
            return <ManagerSettings dictionary={dictionary} lang={lang} />;
        case 'superAdmin':
            return <SuperAdmin dictionary={dictionary}>
            </SuperAdmin>;
        case 'client':
            return <ClientSettings dictionary={dictionary} clientId={clientId} />;
        case 'dietician':
            return <DieticianSettings dictionary={dictionary} />;
        case 'kitchen':
            return <KitchenSettings dictionary={dictionary} />;
        default:
            return null;
    }
};

// const LogoUploadWrapper = ({
//     dictionary,
//     mode
// }: {
//     dictionary: Record<string, string>
//     mode: 'light' | 'dark'
// }) => {
//     return (
//         <div className='flex flex-row gap-4 items-center justify-between'>
//             <div className='text-base font-bold '>{translate(dictionary, `dashboard:logo_upload_${mode}`)}</div>
//             <LogoUpload
//                 dictionary={dictionary}
//                 mode={mode}
//             />
//         </div>
//     );
// }

const Settings: FunctionComponent<{
    lang: LocaleApp,
    pageName: string
    dictionary: Record<string, string>
    clientId?: string
}> = ({ lang, pageName, clientId }) => {
    return (
        <div className='flex flex-col gap-4'>

            <SettingsWrapper
                lang={lang}
                pageName={pageName}
                renderComponent={renderSettingsComponent}
                clientId={clientId}
            />
            {/* TODO: add logo upload in ver 1.1 */}
            {/* <DashboardItemWrapper
                title={translate(dictionary, 'dashboard:personalization')}
                className='max-w-screen-xl'
            >
                {['light', 'dark'].map((mode) => (
                    <LogoUploadWrapper
                        key={mode}
                        dictionary={dictionary}
                        mode={mode as 'light' | 'dark'}
                    />
                ))}
            </DashboardItemWrapper> */}
        </div>
    );
};

export default Settings;
