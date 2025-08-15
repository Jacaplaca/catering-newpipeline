'use client';

import tableTheme from '@root/app/_components/Table/theme';
import MainModal from '@root/app/_components/Modals/MainModal';
import TableColumns from '@root/app/_components/Table/Columns';
import TableContent from '@root/app/_components/Table/Content';
import TableFooter from '@root/app/_components/Table/Footer';
import TableHeader from '@root/app/_components/Table/Header.tsx';
import QuickFilterRow from '@root/app/_components/Table/QuickFilterRow';
import t from '@root/app/lib/lang/translate';
import { useState, type FunctionComponent } from "react";
import RowActions from '@root/app/_components/Table/Actions';
import TableWrapper from '@root/app/_components/Table/Wrapper';
import TableActionConfirm from '@root/app/_components/Table/ActionConfirm';
import MyButton from '@root/app/_components/ui/buttons/MyButton';
import { Table } from 'flowbite-react';
import { useMealCategoryTableContext } from '@root/app/specific/components/Meals/Category/context';
import { api } from '@root/app/trpc/react';
import TableToast from '@root/app/_components/Table/Toast';
import MealCategoryExpandedRow from '@root/app/specific/components/Meals/Category/ExpandedRow';

const MealCategoryTable: FunctionComponent = () => {
    const {
        pageName,
        lang,
        dictionary,
        data: { table, skeleton },
        columns: { columns },
        isFetching,
        totalCount,
        rowClick: { expandedRowId, onRowClick },
        sort: { sortName, sortDirection },
        action: {
            showActions,
            isAllChecked,
            checkAllOnPage,
            getConfirmationData,
            actions
        },
        message,
    } = useMealCategoryTableContext();


    const [isAddOpen, setAddOpen] = useState(false);
    const utils = api.useUtils();

    const addOpen = () => {
        onRowClick(null);
        setAddOpen(true);
        void utils.specific.allergen.getMany.invalidate();
    }
    const addClose = () => { setAddOpen(false) }

    return (
        <div className='relative'>
            <TableActionConfirm
                dictionary={dictionary}
                getData={getConfirmationData}
            />
            <MainModal
                isOpen={isAddOpen}
                closeModal={addClose}
                header={t(dictionary, 'meals:add_category')}
            >
                <MealCategoryExpandedRow />
            </MainModal>
            <TableWrapper>
                <TableHeader
                    dictionary={dictionary}
                    searchPlaceholder={'meals:search_placeholder'}
                >
                    <MyButton
                        onClick={addOpen}
                        icon='fa-solid fa-can-food'
                        id={t(dictionary, 'meals:add_category')}
                        ariaLabel={t(dictionary, 'meals:add_category')}
                    >{t(dictionary, 'meals:add_category')}</MyButton>
                </TableHeader>
                <QuickFilterRow
                    dictionary={dictionary}
                    columns={columns}
                >
                    <RowActions
                        label={t(dictionary, 'shared:actions')}
                        actions={actions}
                        disabled={!showActions}
                        dictionary={dictionary}
                    />
                </QuickFilterRow>

                <Table
                    theme={tableTheme}
                    hoverable
                >
                    <TableColumns
                        columns={columns}
                        check={checkAllOnPage}
                        isCheck={isAllChecked}
                        sortName={sortName}
                        sortDirection={sortDirection}
                        dictionary={dictionary}
                    />
                    <TableContent
                        tableData={isFetching ? skeleton : table}
                        className="divide-y"
                        key={isFetching ? 'skeleton' : 'table'}
                        // show={showColumns}
                        onRowClick={onRowClick}
                        expandedRowId={expandedRowId}
                        ExpandedRow={MealCategoryExpandedRow}
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


export default MealCategoryTable;