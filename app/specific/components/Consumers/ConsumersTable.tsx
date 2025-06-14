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
import { useConsumerTableContext } from '@root/app/specific/components/Consumers/context';
import ConsumerExpandedRow from '@root/app/specific/components/Consumers/ExpandedRow';
import { api } from '@root/app/trpc/react';
import ClientDropdown from '@root/app/specific/components/ui/Dropdown/Client';
import TableToast from '@root/app/_components/Table/Toast';
import SearchInput from '@root/app/_components/ui/Inputs/Search';
import { RoleType } from '@prisma/client';

const ConsumersTable: FunctionComponent = () => {
    const {
        pageName,
        lang,
        dictionary,
        data: { table, skeleton },
        columns: { columns, showColumns, toggleColumn },
        isFetching,
        totalCount,
        search: { customerSearch, dietSearch },
        rowClick: { expandedRowId, onRowClick },
        sort: { sortName, sortDirection },
        action: {
            showActions,
            isAllChecked,
            checkAllOnPage,
            getConfirmationData,
            actions
        },
        filter: { clients: { clientForFilter, chooseClient } },
        message,
        userRole
    } = useConsumerTableContext();


    const [isAddConsumerOpen, setAddConsumerOpen] = useState(false);
    const utils = api.useUtils();
    const isDietician = userRole === RoleType.dietician;
    const isManager = userRole === RoleType.manager;
    const showForDieticianOrManager = isDietician || isManager;

    const clickable = showForDieticianOrManager;

    const addConsumerOpen = () => {
        onRowClick(null);
        setAddConsumerOpen(true);
        void utils.specific.client.getInfinite.invalidate();
    }
    const addConsumerClose = () => { setAddConsumerOpen(false) }

    const showCheckboxes = isDietician || isManager;

    return (
        <div className='relative'>
            <TableActionConfirm
                dictionary={dictionary}
                getData={getConfirmationData}
            />
            {showForDieticianOrManager && <MainModal
                maxWidth='max-w-[400px]'
                allowOverflow
                isOpen={isAddConsumerOpen}
                closeModal={addConsumerClose}
                header={t(dictionary, 'consumers:add_consumer')}
            >
                <ConsumerExpandedRow />
            </MainModal>}
            <TableWrapper>
                <TableHeader
                    search={customerSearch}
                    dictionary={dictionary}
                    title={'consumers:title'}
                    searchPlaceholder={'consumers:search_placeholder'}
                >
                    {showForDieticianOrManager ? <MyButton
                        onClick={addConsumerOpen}
                        icon='fas fa-user-plus'
                        id={t(dictionary, 'consumers:add_consumer')}
                        ariaLabel={t(dictionary, 'consumers:add_consumer')}
                    >{t(dictionary, 'consumers:add_consumer')}</MyButton> : null}
                </TableHeader>
                <QuickFilterRow
                    dictionary={dictionary}
                    columns={columns}
                    toggleColumn={toggleColumn}
                    checkedColumns={showColumns}
                >
                    {showForDieticianOrManager && <RowActions
                        label={t(dictionary, 'shared:actions')}
                        actions={actions}
                        disabled={!showActions}
                        dictionary={dictionary}
                    />}

                    {showForDieticianOrManager && <ClientDropdown
                        dictionary={dictionary}
                        onSelect={chooseClient}
                        selected={clientForFilter}
                    />}

                    {showForDieticianOrManager && <SearchInput
                        search={dietSearch}
                        // inputClassName='w-[300px]'
                        label={t(dictionary, 'shared:search')}
                        placeholder={t(dictionary, 'consumers:diet_search_placeholder')}
                    />}

                </QuickFilterRow>

                <Table
                    theme={tableTheme}
                    hoverable
                >
                    <TableColumns
                        columns={columns}
                        check={showCheckboxes ? checkAllOnPage : undefined}
                        isCheck={showCheckboxes ? isAllChecked : undefined}
                        sortName={sortName}
                        sortDirection={sortDirection}
                        dictionary={dictionary}
                        show={showColumns}

                    />
                    <TableContent
                        tableData={isFetching ? skeleton : table}
                        className="divide-y"
                        key={isFetching ? 'skeleton' : 'table'}
                        show={showColumns}
                        onRowClick={clickable ? onRowClick : undefined}
                        expandedRowId={expandedRowId}
                        ExpandedRow={ConsumerExpandedRow}
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


export default ConsumersTable;