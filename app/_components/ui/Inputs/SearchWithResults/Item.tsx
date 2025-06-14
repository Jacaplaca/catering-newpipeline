import HighlightText from '@root/app/_components/Table/HighlightText';
import ItemWrapper from '@root/app/_components/ui/Inputs/SearchWithResults/ItemWrapper';
import { type VirtualItem } from '@tanstack/react-virtual';
import { type FunctionComponent } from 'react';

export type ItemProps<T extends { id: string, name: string }> = {
    item?: T;
    virtualRow: VirtualItem;
    isLoaderRow: boolean;
    onClick?: (item: T) => void;
    fragment?: string;
    limitChars?: number;
    isSelected?: boolean;
    showSelectionIcon?: boolean;
}

const Item: FunctionComponent<ItemProps<{ id: string, name: string }>> = ({ item, virtualRow, isLoaderRow, onClick, fragment, limitChars = 25, isSelected, showSelectionIcon = false }) => {
    return (
        <ItemWrapper
            item={item}
            virtualRow={virtualRow}
            onClick={onClick}
            isLoaderRow={isLoaderRow}
        >
            <div className="flex items-center w-full">
                {showSelectionIcon && (
                    <div className="mr-3 flex-shrink-0">
                        {isSelected ? (
                            <i className="fa fa-check-circle text-green-600 dark:text-green-400 text-lg"></i>
                        ) : (
                            <i className="fa fa-circle-xmark text-gray-300 dark:text-gray-600 text-lg opacity-50"></i>
                        )}
                    </div>
                )}
                <HighlightText
                    isLoading={isLoaderRow}
                    limit={limitChars}
                    className={`text-base h-full
                                text-neutral-700 dark:text-white
                                flex items-center
                                ${isSelected ? 'font-semibold' : ''}
                                `}
                    text={item?.name ?? ''}
                    fragment={fragment}
                />
            </div>
        </ItemWrapper>
    );
}

export default Item;

