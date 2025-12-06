'use client';
import { useState, useRef, type ReactElement } from "react";
import t from '@root/app/lib/lang/translate';
import { useOnClickOutside } from 'usehooks-ts'
import SearchInput from '@root/app/_components/ui/Inputs/Search';

type SearchWithResultsProps = {
    dictionary: Record<string, string>;
    onSearch: (value: string) => void;
    loading?: boolean;
    placeholder?: string;
    minChars?: number;
    FoundComponent?: ReactElement;
    isError?: boolean;
    ListComponent?: React.ReactNode;
    isFocused?: boolean;
    onFocusChange?: (isFocused: boolean) => void;
    hideResults?: boolean;
    inputClassName?: string;
};

const SearchWithResults = ({
    dictionary,
    onSearch,
    loading = false,
    placeholder,
    FoundComponent,
    isError = false,
    ListComponent,
    isFocused: externalIsFocused,
    onFocusChange,
    hideResults = false,
    inputClassName,
}: SearchWithResultsProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [internalIsFocused, setInternalIsFocused] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const isFocused = externalIsFocused ?? internalIsFocused;

    const handleClear = () => {
        setSearchValue('');
        onSearch('');
    };

    const handleFocus = () => {
        setInternalIsFocused(true);
        onFocusChange?.(true);
    };

    const handleBlur = () => {
        setTimeout(() => {
            setInternalIsFocused(false);
            onFocusChange?.(false);
        }, 200);
    };


    const search = (v: string) => {
        setSearchValue(v);
        onSearch(v);
    }

    const handleClickOutside = () => {
        handleBlur();
    }

    useOnClickOutside(ref as React.RefObject<HTMLElement>, handleClickOutside)

    const showResults = isFocused;

    return (
        <div
            className="relative z-auto"
            ref={ref}
        >
            <div className={`relative ${isFocused ? 'z-6' : 'z-auto'}`}>
                <SearchInput
                    isError={isError}
                    search={search}
                    everyChar
                    debounce={300}
                    loading={loading}
                    label={t(dictionary, 'shared:search')}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    resultComponent={FoundComponent}
                    placeholder={placeholder
                        ? t(dictionary, placeholder)
                        : t(dictionary, 'shared:search')}
                    onClear={handleClear}
                    value={searchValue}
                    inputClassName={`w-[290px] ${inputClassName}`}
                />
            </div>
            {!hideResults && (
                <div
                    className={`
                        z-5
                        absolute top-[-20px] left-[-20px]
                    w-[calc(100%+40px)]
                    bg-white dark:bg-neutral-800
                    rounded-xl
                    border border-neutral-300 dark:border-neutral-800
                    pt-[70px]
                    transition-opacity duration-100 ease-in-out
                    shadow-small dark:shadow-darkmode-small
                    ${showResults ? 'opacity-100 visible' : 'opacity-0 invisible'}
                `}
                >
                    <div className={`flex flex-col
                                overflow-y-auto
                                max-h-[340px]
                                text-neutral-900 dark:text-neutral-100
                ${showResults ? 'opacity-100' : 'opacity-0'}
                `}>
                        {ListComponent}
                    </div>
                </div>
            )}
        </div>
    )
}

export default SearchWithResults;
