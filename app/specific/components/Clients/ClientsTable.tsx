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
import { useClientTableContext } from '@root/app/specific/components/Clients/context';
import TableActionConfirm from '@root/app/_components/Table/ActionConfirm';
import MyButton from '@root/app/_components/ui/buttons/MyButton';
import ClientExpandedRow from '@root/app/specific/components/Clients/ExpandedRow';
import { Table } from 'flowbite-react';
import Invite from '@root/app/_components/Dashboard/Settings/Invite';
// import TagSearch from '@root/app/specific/components/ui/TagSearch';
import TableToast from '@root/app/_components/Table/Toast';

const ClientsTable: FunctionComponent = () => {

    const {
        pageName,
        lang,
        dictionary,
        settings,
        data: { table, skeleton },
        columns: { columns, toggleColumn, showColumns },
        isFetching,
        totalCount,
        search,
        rowClick: { expandedRowId, onRowClick },
        sort: { sortName, sortDirection },
        action: {
            showActions,
            isAllChecked,
            checkAllOnPage,
            getConfirmationData,
            actions
        },
        // filter: { tags: { updateTagId } },
        message
    } = useClientTableContext();

    const [isInviteOpen, setInviteOpen] = useState(false);

    const handleInviteOpen = () => { setInviteOpen(true); }

    return (
        <div className='relative'>
            <TableActionConfirm
                dictionary={dictionary}
                getData={getConfirmationData}
            />
            <MainModal
                isOpen={isInviteOpen}
                closeModal={() => setInviteOpen(false)}
                header={t(dictionary, 'invite:title', [settings?.main?.siteName?.toString()])}
            >
                <Invite
                    lang={lang}
                    dictionary={dictionary}
                    role='client'
                />
            </MainModal>
            <TableWrapper>
                <TableHeader
                    search={search}
                    dictionary={dictionary}
                    title={'clients:title'}
                    searchPlaceholder={'clients:search_placeholder'}
                ><MyButton
                    onClick={handleInviteOpen}
                    icon='fas fa-user-plus'
                    id={t(dictionary, 'clients:add_client')}
                    ariaLabel={t(dictionary, 'clients:add_client')}
                >{t(dictionary, 'clients:add_client')}</MyButton>
                </TableHeader>
                <QuickFilterRow
                    dictionary={dictionary}
                    columns={columns}
                    toggleColumn={toggleColumn}
                    checkedColumns={showColumns}
                >
                    <RowActions
                        label={t(dictionary, 'shared:actions')}
                        actions={actions}
                        disabled={!showActions}
                        dictionary={dictionary}
                    />
                    {/* <TagSearch
                        updateTagId={updateTagId}
                        dictionary={dictionary}
                    /> */}
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
                        show={showColumns}
                        dictionary={dictionary}
                    />
                    <TableContent
                        tableData={isFetching ? skeleton : table}
                        className="divide-y"
                        key={isFetching ? 'skeleton' : 'table'}
                        show={showColumns}
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


export default ClientsTable;