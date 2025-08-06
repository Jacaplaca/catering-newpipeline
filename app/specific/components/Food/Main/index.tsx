'use client';

import tableTheme from '@root/app/_components/Table/theme';
import MainModal from '@root/app/_components/Modals/MainModal';
import TableColumns from '@root/app/_components/Table/Columns';
import TableContent from '@root/app/_components/Table/Content';
import TableFooter from '@root/app/_components/Table/Footer';
import TableHeader from '@root/app/_components/Table/Header.tsx';
import QuickFilterRow from '@root/app/_components/Table/QuickFilterRow';
import t from '@root/app/lib/lang/translate';
import { type FunctionComponent } from "react";
import RowActions from '@root/app/_components/Table/Actions';
import TableWrapper from '@root/app/_components/Table/Wrapper';
import TableActionConfirm from '@root/app/_components/Table/ActionConfirm';
import MyButton from '@root/app/_components/ui/buttons/MyButton';
import { Table } from 'flowbite-react';
import TableToast from '@root/app/_components/Table/Toast';
import FoodExpandedRow from '@root/app/specific/components/Food/Main/ExpandedRow';
import { useFoodTableContext } from '@root/app/specific/components/Food/Main/context';
import FoodCategoryDropdown from '@root/app/specific/components/ui/Dropdown/FoodCategory';
import translate from '@root/app/lib/lang/translate';
import AllergenDropdown from '@root/app/specific/components/ui/Dropdown/Allergen';

const FoodTable: FunctionComponent = () => {
    const {
        pageName,
        lang,
        dictionary,
        data: { table, skeleton },
        columns: { columns },
        isFetching,
        totalCount,
        countIsFetching,
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
        filter: { search, addRemoveFoodCategory, addRemoveAllergen, allergens, foodCategory },
        addModal: { isAddOpen, addOpen, addClose },
    } = useFoodTableContext();

    return (
        <div className='relative'>
            <TableActionConfirm
                dictionary={dictionary}
                getData={getConfirmationData}
            />
            <MainModal
                isOpen={isAddOpen}
                closeModal={addClose}
                header={t(dictionary, 'food:add_dish')}
                allowOverflow
            >
                <FoodExpandedRow />
            </MainModal>
            <TableWrapper>
                <TableHeader
                    dictionary={dictionary}
                    search={search}
                >
                    <MyButton
                        onClick={addOpen}
                        icon='fa-solid fa-salad'
                        id={t(dictionary, 'food:add_dish')}
                        ariaLabel={t(dictionary, 'food:add_dish')}
                    >{t(dictionary, 'food:add_dish')}</MyButton>
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

                    <FoodCategoryDropdown
                        dictionary={dictionary}
                        onSelect={addRemoveFoodCategory}
                        selectedItem={foodCategory ?? undefined}
                        // inputClassName='w-full'
                        foundLimitChars={35}
                    />

                    <AllergenDropdown
                        dictionary={dictionary}
                        // inputClassName='w-full'
                        foundLimitChars={35}
                        selectedItems={allergens}
                        onItemsChange={addRemoveAllergen}
                        showSelectionIcon
                        placeholder={translate(dictionary, 'food:allergens_placeholder')}
                        selectedLabel={translate(dictionary, 'food:selected_allergens')}
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
                        ExpandedRow={FoodExpandedRow}
                    />
                </Table>
                <TableFooter
                    totalCount={totalCount}
                    pageName={pageName}
                    lang={lang}
                    dictionary={dictionary}
                    isLoading={countIsFetching}
                />
            </TableWrapper>
            <TableToast
                message={message?.messageObj}
                onClose={message?.resetMessage}
            />
        </div >
    );
}


export default FoodTable;