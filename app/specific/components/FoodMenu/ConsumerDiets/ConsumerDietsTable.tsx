'use client';

import tableTheme from '@root/app/_components/Table/theme';
import TableColumns from '@root/app/_components/Table/Columns';
import TableContent from '@root/app/_components/Table/Content';
import TableFooter from '@root/app/_components/Table/Footer';
import TableHeader from '@root/app/_components/Table/Header.tsx';
import { type FunctionComponent } from "react";
import TableWrapper from '@root/app/_components/Table/Wrapper';
import TableActionConfirm from '@root/app/_components/Table/ActionConfirm';
import ClientExpandedRow from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow';
import { Table } from 'flowbite-react';
import TableToast from '@root/app/_components/Table/Toast';
import { useConsumerDietsTableContext } from '@root/app/specific/components/FoodMenu/ConsumerDiets/context';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import AllergenDropdown from '@root/app/specific/components/ui/Dropdown/Allergen';
import translate from '@root/app/lib/lang/translate';

const ConsumerDietsTable: FunctionComponent = () => {

    const {
        pageName,
        lang,
        dictionary,
        data: { table, skeleton },
        columns,
        isFetching,
        totalCount,
        search,
        sort: { sortName, sortDirection },
        filter: { allergens, addRemoveAllergen, clearAllergens },
        fetchOneWithCommonAllergens
    } = useConsumerDietsTableContext();
    const { rowClick: { onRowClick, expandedRowId }, message, getConfirmationData } = useFoodMenuContext(
        // { updateClientRow: fetchOneWithCommonAllergens.actions.fetchForClient }
    );

    return (
        <div className='relative'>
            <TableActionConfirm
                dictionary={dictionary}
                getData={getConfirmationData}
            />
            <TableWrapper>
                <TableHeader
                    search={search}
                    dictionary={dictionary}
                    title={'clients:title'}
                    searchPlaceholder={'clients:search_placeholder'}
                >
                    <div className='flex items-center gap-2 max-w-72'>
                        <AllergenDropdown
                            dictionary={dictionary}
                            inputClassName='w-72'
                            foundLimitChars={35}
                            selectedItems={allergens}
                            onItemsChange={addRemoveAllergen}
                            showSelectionIcon
                            placeholder={translate(dictionary, 'food:allergens_placeholder')}
                            selectedLabel={translate(dictionary, 'food:selected_allergens')}
                            clearAll={clearAllergens}
                            clearAllLabel={translate(dictionary, 'food:clear_allergens')}
                        />
                    </div>
                </TableHeader>
                <Table
                    theme={tableTheme}
                    hoverable
                >
                    <TableColumns
                        columns={columns}
                        // check={checkAllOnPage}
                        // isCheck={isAllChecked}
                        sortName={sortName}
                        sortDirection={sortDirection}
                        // show={showColumns}
                        dictionary={dictionary}
                    />
                    <TableContent
                        tableData={isFetching ? skeleton : table}
                        className="divide-y"
                        key={isFetching ? 'skeleton' : 'table'}
                        // show={showColumns}
                        onRowClick={onRowClick}
                        expandedRowId={expandedRowId}
                        ExpandedRow={ClientExpandedRow}
                    />
                </Table>
                <TableFooter
                    totalCount={totalCount}
                    pageName={pageName}
                    lang={lang}
                    dictionary={dictionary}
                />
            </TableWrapper>
            <TableToast
                message={message?.messageObj}
                onClose={message?.resetMessage}
            />
        </div >
    );
}


export default ConsumerDietsTable;