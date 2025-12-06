import SearchWithResults from '@root/app/_components/ui/Inputs/SearchWithResults';
import ListWrapper from '@root/app/_components/ui/Inputs/SearchWithResults/ListWrapper';
import useVirtualizedList from '@root/app/hooks/useVirtualizedListl';
import { api } from '@root/app/trpc/react';
import { type FunctionComponent, type RefObject, useState } from "react";
import Item from '@root/app/_components/ui/Inputs/SearchWithResults/Item';
import SelectedDisplay from './SelectedDisplay';
import useDropdownMultiple from '@root/app/specific/components/ui/Dropdown/useDropdownMultiple';
import SelectedFoods from '@root/app/specific/components/ui/Dropdown/SelectedFoods';

const ITEMS_PER_PAGE = 20;

type ExclusionDropdownProps = {
    dictionary: Record<string, string>;
    selectedItems: { id: string, name: string, allergens: { id: string, name: string }[] }[];
    inputClassName?: string;
    foundLimitChars?: number;
    hideSelected?: boolean;
    showSelectionIcon?: boolean;
    onItemsChange: (items: { id: string, name: string }[]) => void;
    placeholder: string;
    allergens?: { id: string, name: string }[];
    withAllergens?: string[];
    limitItems?: number;
}

const ExclusionDropdown: FunctionComponent<ExclusionDropdownProps> = ({
    dictionary,
    selectedItems,
    inputClassName,
    foundLimitChars,
    hideSelected = false,
    showSelectionIcon = false,
    onItemsChange,
    placeholder,
    allergens,
    withAllergens,
    limitItems,
}) => {

    const [foodIdsFromHoveredAllergenId, setFoodIdsFromHoveredAllergenId] = useState<string[]>([]);
    const [allergenIdsFromHoveredFoodId, setAllergenIdsFromHoveredFoodId] = useState<string[]>([]);

    const handleFoodMouseEnter = (foodId: string | null) => {
        if (foodId) {
            const allergens = selectedItems.find(food => food.id === foodId)?.allergens.map(allergen => allergen.id) ?? [];
            setFoodIdsFromHoveredAllergenId(allergens);
        } else {
            setFoodIdsFromHoveredAllergenId([]);
        }
    }

    const handleAllergenMouseEnter = (allergenId: string | null) => {
        if (allergenId) {
            const foods = selectedItems.filter(food => food.allergens.some(allergen => allergen.id === allergenId));
            setAllergenIdsFromHoveredFoodId(foods.map(food => food.id));
        } else {
            setAllergenIdsFromHoveredFoodId([]);
        }
    }

    const { searchValue, searchItems, onResultClick, handleRemoveItem, ref } = useDropdownMultiple({
        onItemsChange,
        selectedItems,
        limitItems,
    });

    const removeAllergen = (allergenId: string) => {
        console.log({ allergenId });
        const foodsWithoutAllergen = selectedItems.filter(food =>
            !food.allergens.some(allergen => allergen.id === allergenId)
        )

        onItemsChange(foodsWithoutAllergen);
    }

    const response = api.specific.exclusion.getInfinite.useInfiniteQuery(
        {
            limit: ITEMS_PER_PAGE,
            searchValue,
            withAllergens,
        },
        {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
        }
    );

    const { rowVirtualizer, items, isLoading, isEmpty } = useVirtualizedList<{ id: string, name: string }>({
        ...response,
        parentRef: ref as RefObject<HTMLElement>,
        Item,
        onResultClick,
        searchValue: searchValue,
        limitChars: foundLimitChars,
        selectedIds: selectedItems?.map(item => item.id),
        hideSelected,
        showSelectionIcon,
    });

    // const allAllergens = selectedItems?.flatMap(item => item.allergens) ?? [];
    // const allergens = Array.from(new Map(allAllergens.map(allergen => [allergen.id, allergen])).values());

    return (
        <div className='flex flex-col gap-2 w-full'>
            <SearchWithResults
                dictionary={dictionary}
                ListComponent={<ListWrapper
                    totalHeight={rowVirtualizer.getTotalSize()}
                    parentRef={ref as RefObject<HTMLDivElement>}
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
                <SelectedFoods
                    selectedItems={selectedItems}
                    highlightedItems={allergenIdsFromHoveredFoodId}
                    onRemove={handleRemoveItem}
                    onMouseEnter={handleFoodMouseEnter}
                    iconClassName='fa-solid fa-salad'
                />
            )}
            {allergens && allergens.length > 0 && (
                <SelectedDisplay
                    selectedItems={allergens}
                    highlightedItems={foodIdsFromHoveredAllergenId}
                    onRemove={removeAllergen}
                    onMouseEnter={handleAllergenMouseEnter}
                    iconClassName='fa-solid fa-wheat-slash'
                />
            )}
        </div>
    )
}

export default ExclusionDropdown;