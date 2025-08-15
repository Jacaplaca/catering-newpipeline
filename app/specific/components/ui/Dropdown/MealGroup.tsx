import SearchWithResults from '@root/app/_components/ui/Inputs/SearchWithResults';
import ListWrapper from '@root/app/_components/ui/Inputs/SearchWithResults/ListWrapper';
import useVirtualizedList from '@root/app/hooks/useVirtualizedListl';
import translate from '@root/app/lib/lang/translate';
import { api } from '@root/app/trpc/react';
import { type FunctionComponent } from 'react';
import FoundResults from '@root/app/_components/ui/Inputs/SearchWithResults/Found';
import Item from '@root/app/_components/ui/Inputs/SearchWithResults/Item';
import useDropdown from '@root/app/specific/components/ui/Dropdown/useDropdown';

const ITEMS_PER_PAGE = 5;

const MealGroupDropdown: FunctionComponent<{
    dictionary: Record<string, string>;
    onSelect: (item: { id: string, name: string } | null) => void;
    selectedItem?: { id: string, name: string };
    inputClassName?: string;
    foundLimitChars?: number;
}> = ({ dictionary, onSelect, selectedItem, inputClassName, foundLimitChars = 22 }) => {

    const { ref, searchValue, isFocused, key, updateValue, onResultClick, handleSelect, setIsFocused } =
        useDropdown<{ id: string, name: string }>(onSelect);

    // const { data: selectedFoodCategories } = api.specific.foodCategory.getManyByIds.useQuery(
    //     {
    //         ids: selectedIds ?? [],
    //     },
    //     {
    //         enabled: !!selectedIds,
    //     }
    // );
    const response = api.specific.mealGroup.getInfinite.useInfiniteQuery(
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
        searchValue,
        limitChars: 30,
        // selectedIds: [selectedId ?? ""],
    });

    // console.log("🚀 ~ allItems:", allItems, { searchValue, selectedId })

    return <SearchWithResults
        key={key}
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
        placeholder={translate(dictionary, 'meals:meal_group_placeholder')}
        FoundComponent={<FoundResults
            limit={foundLimitChars}
            clearValue={() => handleSelect(null)}
            // value={selectedObjs?.[0]?.name ?? ''}
            value={selectedItem?.name ?? ''}
        />}
        onSearch={updateValue}
        isFocused={isFocused}
        onFocusChange={setIsFocused}
        inputClassName={inputClassName}
    />
}

export default MealGroupDropdown;