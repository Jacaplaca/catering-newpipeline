'use client';
import ConsumerDietsTable from '@root/app/specific/components/FoodMenu/ConsumerDiets/ConsumerDietsTable';
import { TableContextProvider } from '@root/app/specific/components/FoodMenu/ConsumerDiets/context';
// import StandardMenuDay from '@root/app/specific/components/FoodMenu/ConsumerDiets/StandardMenuDay';
import useConsumerDietsTable from '@root/app/specific/components/FoodMenu/ConsumerDiets/useConsumerDietsTable';
import { type SettingParsedType } from '@root/types';
import { type FunctionComponent } from 'react';

const ConsumerDiets: FunctionComponent<{
    lang: LocaleApp
    pageName: string
    dictionary: Record<string, string>
    settings: { main: SettingParsedType }
}> = (props) => {

    return (
        <TableContextProvider store={useConsumerDietsTable(props)} >
            <div className='flex flex-col gap-4'>
                {/* <StandardMenuDay /> */}
                <ConsumerDietsTable />
            </div>
        </TableContextProvider>
    );
};

export default ConsumerDiets;