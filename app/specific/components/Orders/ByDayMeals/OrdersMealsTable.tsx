'use client';

import tableTheme from '@root/app/_components/Table/theme';
import TableColumns from '@root/app/_components/Table/Columns';
import TableContent from '@root/app/_components/Table/Content';
import TableFooter from '@root/app/_components/Table/Footer';
import TableHeader from '@root/app/_components/Table/Header.tsx';
import { type FunctionComponent } from "react";
import TableWrapper from '@root/app/_components/Table/Wrapper';
import TableActionConfirm from '@root/app/_components/Table/ActionConfirm';
import { Table } from 'flowbite-react';
import TableToast from '@root/app/_components/Table/Toast';
import OrderDayExpandedRow from '@root/app/specific/components/Orders/ByDayMeals/ExpandedRow';
import { useOrderByDayMealsTableContext } from '@root/app/specific/components/Orders/ByDayMeals/context';

const OrdersByDayMealsTable: FunctionComponent = () => {

    const {
        pageName,
        lang,
        dictionary,
        data: { table, skeleton },
        columns,
        isFetching,
        totalCount,
        row: { dayId, onClick },
        sort: { sortName, sortDirection },
        action: {
            getConfirmationData,
        },
        message
    } = useOrderByDayMealsTableContext();

    const clickable = false;

    return (
        <div className='relative'>
            <TableActionConfirm
                dictionary={dictionary}
                getData={getConfirmationData}
            />
            <TableWrapper>
                <TableHeader
                    // search={search}
                    dictionary={dictionary}
                    title={'orders:title'}
                    searchPlaceholder={'orders:search_placeholder'}
                >
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
                        dictionary={dictionary}
                    />
                    <TableContent
                        tableData={isFetching ? skeleton : table}
                        className="divide-y"
                        key={isFetching ? 'skeleton' : 'table'}
                        onRowClick={clickable ? onClick : undefined}
                        expandedRowId={dayId}
                        ExpandedRow={OrderDayExpandedRow}
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
        </div>



    );
}


export default OrdersByDayMealsTable;