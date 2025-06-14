import SearchWithResults from '@root/app/_components/ui/Inputs/SearchWithResults';
import ListWrapper from '@root/app/_components/ui/Inputs/SearchWithResults/ListWrapper';
import useVirtualizedList from '@root/app/hooks/useVirtualizedListl';
import translate from '@root/app/lib/lang/translate';
import { api } from '@root/app/trpc/react';
import { type FunctionComponent } from "react";
import Item from '@root/app/_components/ui/Inputs/SearchWithResults/Item';
import FoundResults from '@root/app/_components/ui/Inputs/SearchWithResults/Found';
import useDropdown from '@root/app/specific/components/ui/Dropdown/useDropdown';

const ITEMS_PER_PAGE = 20;

const RegularMenuDropdown: FunctionComponent<{
    dictionary: Record<string, string>;
    onSelect: (item: { id: string, name: string } | null) => void;
    selected?: { id: string, name: string } | null;
}> = ({ dictionary, onSelect, selected }) => {
    const { ref, searchValue, isFocused, updateValue, onResultClick, handleSelect, setIsFocused } = useDropdown(onSelect);
    // const tagsRef = useRef<HTMLDivElement>(null);
    // const [deliveryRouteSearchValue, setDeliveryRouteSearch] = useState<string>('');
    // const [deliveryRouteForFilter, setDeliveryRouteForFilter] = useState<{ id: string, name: string } | null>(null);

    // const searchDeliveryRoutes = (value: string) => {
    //     setDeliveryRouteSearch(value);
    // }

    // const clearSearchResult = () => {
    //     setDeliveryRouteForFilter(null);
    //     onSelect('');
    // }

    const response = api.specific.regularMenu.getInfinite.useInfiniteQuery(
        {
            limit: ITEMS_PER_PAGE,
            searchValue: searchValue,
        },
        {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
        }
    );

    // function searchByDeliveryRoute(item: { id: string, name: string } | null) {
    //     onSelect(item);
    //     setDeliveryRouteForFilter(item ?? null)
    // }

    const { rowVirtualizer, items, isLoading, isEmpty } = useVirtualizedList<{ id: string, name: string }>({
        ...response,
        parentRef: ref,
        Item,
        onResultClick,
        searchValue
    });

    // useEffect(() => {
    //     if (selected) {
    //         searchByDeliveryRoute(selected);
    //     }
    // }, [selected]);

    return (
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
            placeholder={translate(dictionary, 'menu-creator:choose_source_menu')}
            FoundComponent={<FoundResults
                clearValue={() => handleSelect(null)}
                value={selected?.name ?? ''}
            />}
            onSearch={updateValue}
            isFocused={isFocused}
            onFocusChange={setIsFocused}
            inputClassName='w-full'
        />
    )
}

export default RegularMenuDropdown;