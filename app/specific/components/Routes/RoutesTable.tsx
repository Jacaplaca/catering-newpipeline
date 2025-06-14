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
import { useRouteTableContext } from '@root/app/specific/components/Routes/context';
import RouteExpandedRow from '@root/app/specific/components/Routes/ExpandedRow';
import { api } from '@root/app/trpc/react';
import TableToast from '@root/app/_components/Table/Toast';

const RoutesTable: FunctionComponent = () => {
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
    } = useRouteTableContext();


    const [isAddRouteOpen, setAddRouteOpen] = useState(false);
    const utils = api.useUtils();

    const addRouteOpen = () => {
        onRowClick(null);
        setAddRouteOpen(true);
        void utils.specific.deliveryRoute.getMany.invalidate();
    }
    const addRouteClose = () => { setAddRouteOpen(false) }

    return (
        <div className='relative'>
            <TableActionConfirm
                dictionary={dictionary}
                getData={getConfirmationData}
            />
            <MainModal
                isOpen={isAddRouteOpen}
                closeModal={addRouteClose}
                header={t(dictionary, 'routes:add_route')}
            >
                <RouteExpandedRow />
            </MainModal>
            <TableWrapper>
                <TableHeader
                    // search={customerSearch}
                    dictionary={dictionary}
                    title={'routes:title'}
                    searchPlaceholder={'routes:search_placeholder'}
                >
                    <MyButton
                        onClick={addRouteOpen}
                        icon='fas fa-truck-fast'
                        id={t(dictionary, 'routes:add_route')}
                        ariaLabel={t(dictionary, 'routes:add_route')}
                    >{t(dictionary, 'routes:add_route')}</MyButton>
                </TableHeader>
                <QuickFilterRow
                    dictionary={dictionary}
                    columns={columns}
                // toggleColumn={toggleColumn}
                // checkedColumns={showColumns}
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
                    // show={showColumns}

                    />
                    <TableContent
                        tableData={isFetching ? skeleton : table}
                        className="divide-y"
                        key={isFetching ? 'skeleton' : 'table'}
                        // show={showColumns}
                        onRowClick={onRowClick}
                        expandedRowId={expandedRowId}
                        ExpandedRow={RouteExpandedRow}
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


export default RoutesTable;