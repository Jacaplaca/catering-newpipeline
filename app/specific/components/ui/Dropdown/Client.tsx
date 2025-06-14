import SearchWithResults from '@root/app/_components/ui/Inputs/SearchWithResults';
import ListWrapper from '@root/app/_components/ui/Inputs/SearchWithResults/ListWrapper';
import useVirtualizedList from '@root/app/hooks/useVirtualizedListl';
import translate from '@root/app/lib/lang/translate';
import { api } from '@root/app/trpc/react';
import { type FunctionComponent } from 'react';
import FoundResults from '@root/app/_components/ui/Inputs/SearchWithResults/Found';
import { type VirtualItem } from '@tanstack/react-virtual';
import HighlightText from '@root/app/_components/Table/HighlightText';
import ItemWrapper from '@root/app/_components/ui/Inputs/SearchWithResults/ItemWrapper';
import useDropdown from '@root/app/specific/components/ui/Dropdown/useDropdown';

const ITEMS_PER_PAGE = 10;

type ClientItem = { id: string, name: string, code: string | number };

export type ItemProps = {
    item?: ClientItem;
    virtualRow: VirtualItem;
    isLoaderRow: boolean;
    onClick?: (item: ClientItem) => void;
    fragment?: string;
    limitChars?: number;
    isSelected?: boolean;
}

const Item: FunctionComponent<ItemProps> = ({ item, virtualRow, isLoaderRow, onClick, fragment, limitChars = 25, isSelected }) => {
    // console.log("fragment", fragment + "AAA")
    return (
        <ItemWrapper
            item={item}
            virtualRow={virtualRow}
            onClick={onClick ? () => onClick(item!) : undefined}
            isLoaderRow={isLoaderRow}
        // isSelected={isSelected}
        >
            <div className='flex flex-row items-center justify-between w-full gap-2'>
                <div className='flex flex-row items-start gap-2'>
                    <i className={`fa-solid fa-circle-check text-sm
                ${isSelected
                            ? `text-secondary-accent dark:text-darkmode-secondary
                        group-hover:text-white dark:group-hover:text-white
                        `
                            : 'text-transparent'}
                        `} />
                    <HighlightText
                        isLoading={isLoaderRow}
                        limit={limitChars}
                        className={`text-sm  h-full
                        text-neutral-700 dark:text-white
                        `}
                        text={item?.name ?? ''}
                        fragment={fragment}
                    />
                </div>
                {item?.code && <div className='text-xs text-neutral-700 dark:text-neutral-200'>
                    <HighlightText
                        isLoading={isLoaderRow}
                        limit={limitChars}
                        className={`text-sm  h-full
                        text-neutral-700 dark:text-white
                        `}
                        text={String(item.code ?? '')}
                        fragment={fragment}
                    />
                </div>}
            </div>
        </ItemWrapper>
    );
}
const ClientDropdown: FunctionComponent<{
    dictionary: Record<string, string>;
    onSelect: (item: ClientItem | null) => void;
    selected?: ClientItem | null;
    inputClassName?: string;
    foundLimitChars?: number;
}> = ({ dictionary, onSelect, selected, inputClassName, foundLimitChars = 22 }) => {
    const { ref, searchValue, isFocused, key, updateValue, onResultClick, handleSelect, setIsFocused } =
        useDropdown<ClientItem>(onSelect);

    const response = api.specific.client.getInfinite.useInfiniteQuery(
        {
            limit: ITEMS_PER_PAGE,
            name: searchValue,
        },
        {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
        }
    );

    // const onResultClick = (id: string | null, allItems: { id: string, name: string }[]) => {
    //     select(id, allItems as { id: string, name: string, code: string }[]);
    //     if (!isMulti) {
    //         setIsFocused(false);
    //         setKey(prevKey => prevKey + 1);
    //     }
    // }

    const { rowVirtualizer, items: clients, isLoading, isEmpty } = useVirtualizedList<ClientItem>({
        ...response,
        parentRef: ref,
        Item,
        onResultClick,
        searchValue,
        limitChars: 30,
        // selectedItems: selectedMultiple,
    });

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
            {clients}
        </ListWrapper>
        }
        placeholder={translate(dictionary, 'shared:search_client_placeholder')}
        FoundComponent={<FoundResults
            limit={foundLimitChars}
            clearValue={() => handleSelect(null)}
            value={selected?.name ?? ''}
        />}
        onSearch={updateValue}
        isFocused={isFocused}
        onFocusChange={setIsFocused}
        inputClassName={inputClassName}
    />
}

export default ClientDropdown;