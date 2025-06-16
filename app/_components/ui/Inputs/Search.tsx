'use client';

import InputStandard from '@root/app/_components/ui/Inputs/Standard';
import { useState, useRef, type FunctionComponent, useEffect } from 'react';
import { useDebounceValue, useEventListener } from 'usehooks-ts';

const SearchInput: FunctionComponent<{
    search: (value: string) => void
    label?: string
    placeholder: string
    everyChar?: boolean
    debounce?: number
    loading?: boolean
    resultComponent?: JSX.Element,
    isError?: boolean
    onFocus?: () => void;
    onBlur?: () => void;
    onClear?: () => void;
    value?: string;
    inputClassName?: string;
}> = ({ search, label, placeholder, everyChar, debounce = 0, loading = false, resultComponent, isError = false, onFocus, onBlur, onClear, inputClassName = '' }) => {
    const [searchValue, setSearchValue] = useState<string>('');
    const [debouncedValue, setDebouncedValue] = useDebounceValue(searchValue, debounce)
    const inputRef = useRef<HTMLInputElement>(null);

    useEventListener('keydown', (event: Event & { key: string }) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSubmit();
        }
    }, inputRef);

    useEffect(() => {
        everyChar && search(debouncedValue);
    }, [debouncedValue]);

    const handleSubmit = (): void => {
        everyChar ? null : search(searchValue);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>): void => {
        setSearchValue(event.target.value);
        everyChar && setDebouncedValue(event.target.value);
    };

    const handleClick = () => {
        search(searchValue);
    }

    const handleClear = () => {
        setSearchValue('');
        onClear?.();
    };

    const isDisabled = loading || !searchValue;

    return (
        <div className="">
            {label && <label
                htmlFor="default-search"
                className="mb-2 text-sm font-medium text-neutral-900 sr-only dark:text-white">
                {label}
            </label>}
            <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <i className={`${loading
                        ? 'animate-spin fas fa-spinner'
                        : 'fa-regular fa-magnifying-glass'}
                    text-neutral-500 dark:text-neutral-400`}></i>
                </div>
                <div className={`
                        absolute flex inset-y-0 end-[6px] items-center

                `}>
                    {resultComponent}
                </div>
                <InputStandard
                    ref={inputRef}
                    type="text"
                    id="default-search"
                    className={`block w-full px-4 py-2 ps-10 ${inputClassName}`}
                    placeholder={placeholder}
                    value={searchValue}
                    onChange={handleInputChange}
                    onClick={handleClick}
                    isError={isError}
                    autoComplete="off"
                    focus={onFocus}
                    blur={onBlur}
                />
                {((Boolean(everyChar) || Boolean(searchValue)) && !resultComponent?.props.value) &&
                    <div className='absolute inset-y-0 end-0 flex items-center'>
                        {Boolean(searchValue) && <button
                            onClick={handleClear}
                            type="button"
                            className="mr-3 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200">
                            <i className="fas fa-times"></i>
                        </button>}
                        {Boolean(everyChar) && <button
                            onClick={handleSubmit}
                            type="button"
                            disabled={isDisabled}
                            className={`px-2.5
                                text-sm font-medium h-full text-neutral-900 dark:text-white
                                bg-secondary rounded-e-lg border border-secondary hover:bg-secondary-accent
                                focus:ring-2 focus:outline-none focus:ring-secondary  focus:dark:ring-darkmode-secondary-accent
                                dark:bg-darkmode-secondary
                                dark:border-secondary-accent
                                dark:hover:bg-darkmode-secondary-accent
                                dark:focus:bg-darkmode-secondary
                                disabled:opacity-50 disabled:cursor-not-allowed
                                `}>
                            {label}
                            <span className="sr-only">{label}</span>
                        </button>}
                    </div>
                }

            </div>
        </div>
    )
};

export default SearchInput;