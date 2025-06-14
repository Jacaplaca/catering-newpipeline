import SearchWithResults from '@root/app/_components/ui/Inputs/SearchWithResults';
import ListWrapper from '@root/app/_components/ui/Inputs/SearchWithResults/ListWrapper';
import useVirtualizedList from '@root/app/hooks/useVirtualizedListl';
import translate from '@root/app/lib/lang/translate';
import { api } from '@root/app/trpc/react';
import { type FunctionComponent } from "react";
import Item from '@root/app/_components/ui/Inputs/SearchWithResults/Item';
import SelectedDisplay from './SelectedDisplay';
import useDropdownMultiple from '@root/app/specific/components/ui/Dropdown/useDropdownMultiple';

const ITEMS_PER_PAGE = 20;

type AllergenDropdownProps = {
    dictionary: Record<string, string>;
    selectedItems: { id: string, name: string }[];
    inputClassName?: string;
    foundLimitChars?: number;
    hideSelected?: boolean;
    showSelectionIcon?: boolean;
    onItemsChange: (items: { id: string, name: string }[]) => void;
    placeholder: string;
    selectedLabel: string;
}

const AllergenDropdown: FunctionComponent<AllergenDropdownProps> = ({
    dictionary,
    selectedItems,
    inputClassName,
    foundLimitChars,
    hideSelected = false,
    showSelectionIcon = false,
    onItemsChange,
    placeholder,
    selectedLabel,
}) => {

    const { searchValue, searchItems, onResultClick, handleRemoveItem, ref } = useDropdownMultiple({
        onItemsChange,
        selectedItems,
    });

    const response = api.specific.allergen.getInfinite.useInfiniteQuery(
        {
            limit: ITEMS_PER_PAGE,
            searchValue,
        },
        {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
        }
    );

    const { rowVirtualizer, items, isLoading, isEmpty } = useVirtualizedList<{ id: string, name: string }>({
        ...response,
        parentRef: ref,
        Item,
        onResultClick,
        searchValue: searchValue,
        limitChars: foundLimitChars,
        selectedIds: selectedItems?.map(item => item.id),
        hideSelected,
        showSelectionIcon,
    });

    return (
        <div className='flex flex-col gap-2'>
            <SearchWithResults
                dictionary={dictionary}
                ListComponent={<ListWrapper
                    totalHeight={rowVirtualizer.getTotalSize()}
                    parentRef={ref}
                    isEmpty={isEmpty}
                    isLoading={isLoading}
                    dictionary={dictionary}
                >
                    {items}
                </ListWrapper>
                }
                placeholder={placeholder}
                onSearch={searchItems}
                inputClassName={inputClassName}
            />
            {selectedItems && (
                <SelectedDisplay
                    label={selectedLabel}
                    selectedItems={selectedItems}
                    onRemove={handleRemoveItem}
                    iconClassName='fa-solid fa-wheat-slash'
                />
            )}
        </div>
    )
}

export default AllergenDropdown;