'use client';
import { type FunctionComponent } from 'react';
import { type SettingParsedType } from '@root/types';
import ExclusionTable from '@root/app/specific/components/Exclusion/Main';
import { ExclusionTableContextProvider } from '@root/app/specific/components/Exclusion/Main/context';
import useExclusionTable from '@root/app/specific/components/Exclusion/Main/useTable';

const ExclusionMainComponent: FunctionComponent<{
    lang: LocaleApp,
    pageName: string,
    dictionary: Record<string, string>,
    settings: { main: SettingParsedType },
}> = (props) => {
    return (
        <ExclusionTableContextProvider store={useExclusionTable(props)}  >
            <ExclusionTable />
        </ExclusionTableContextProvider>
    );
};

export default ExclusionMainComponent;