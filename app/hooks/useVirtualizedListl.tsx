import { useState, useEffect, useMemo } from 'react';
import { useVirtualizer, type Virtualizer, type VirtualItem } from '@tanstack/react-virtual';
import { useCallback, type FunctionComponent } from 'react';
import { type InfiniteData } from '@tanstack/react-query';
import { type ItemProps } from '@root/app/_components/ui/Inputs/SearchWithResults/Item';

interface UseVirtualizedListProps<T extends { id: string; name: string }> {
    data: InfiniteData<{ items: T[]; nextCursor: number | undefined;[key: string]: unknown }, unknown> | undefined;
    fetchNextPage: () => Promise<unknown>;
    hasNextPage: boolean | undefined;
    isFetchingNextPage: boolean;
    isError: boolean;
    error: unknown;
    isFetching: boolean;
    parentRef: React.RefObject<HTMLElement>;
    estimateSize?: number;
    overscan?: number;
    Item: FunctionComponent<ItemProps<T>>;
    onResultClick?: (item: T) => void;
    searchValue?: string;
    limitChars?: number;
    hideSelected?: boolean;
    showSelectionIcon?: boolean;
    selectedIds?: string[];
}

interface UseVirtualizedListResult<T extends { id: string; name: string }> {
    rowVirtualizer: Virtualizer<HTMLElement, Element>;
    virtualItems: VirtualItem[];
    renderItem: (virtualRow: VirtualItem) => React.ReactNode;
    items: React.ReactNode[];
    isLoading: boolean;
    isEmpty: boolean;
    allItems: T[];
    selectedObjs: T[] | null;
}

export function useVirtualizedList<T extends { id: string; name: string }>({
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
    isFetching,
    parentRef,
    estimateSize = 50,
    overscan = 5,
    Item,
    onResultClick,
    searchValue,
    limitChars = 25,
    hideSelected = false,
    showSelectionIcon = false,
    selectedIds,
}: UseVirtualizedListProps<T>): UseVirtualizedListResult<T> {
    const dataFlat = useMemo(() => data?.pages.flatMap(page => page.items) ?? [], [data]);

    const allItems = useMemo(() => {
        if (hideSelected && selectedIds) {
            return dataFlat.filter(item => !selectedIds.includes(item.id));
        }

        return dataFlat;
    }, [dataFlat, hideSelected, selectedIds]);

    const rowVirtualizer = useVirtualizer({
        count: hasNextPage ? allItems.length + 1 : allItems.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimateSize,
        overscan,
    });

    const [lastItemIndex, setLastItemIndex] = useState(0);
    const virtualItems = rowVirtualizer.getVirtualItems();

    useEffect(() => {
        const lastItem = virtualItems.at(-1);
        if (lastItem) {
            setLastItemIndex(lastItem.index);
        }
    }, [virtualItems]);

    useEffect(() => {
        if (lastItemIndex >= allItems.length - 1 && hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
        }
    }, [lastItemIndex, allItems.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

    useEffect(() => {
        if (isError) {
            console.error('Error fetching data:', error);
        }
    }, [isError, error]);

    const isLoading = isFetching || isFetchingNextPage;
    const isEmpty = allItems.length === 0;

    const renderItem = useCallback((virtualRow: VirtualItem) => {
        const item = allItems[virtualRow.index] as T | undefined;
        const isLoaderRow = virtualRow.index > allItems.length - 1;

        return <Item
            virtualRow={virtualRow}
            item={item}
            isLoaderRow={isLoaderRow}
            key={virtualRow.index}
            onClick={(item: T) => onResultClick?.(item)}
            fragment={searchValue}
            limitChars={limitChars}
            isSelected={selectedIds?.includes(item?.id ?? '')}
            showSelectionIcon={showSelectionIcon}
        />;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allItems, onResultClick, searchValue, limitChars, selectedIds, showSelectionIcon]);

    return {
        rowVirtualizer,
        virtualItems,
        renderItem,
        items: virtualItems.map(renderItem),
        isLoading,
        isEmpty,
        allItems,
        selectedObjs: dataFlat.filter(item => selectedIds?.includes(item.id)),
    };
}

export default useVirtualizedList;