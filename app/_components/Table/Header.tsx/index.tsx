'use client';

import SearchInput from '@root/app/_components/ui/Inputs/Search';
import t from '@root/app/lib/lang/translate';
import { Label } from "flowbite-react";
import { type FunctionComponent, type ReactNode } from 'react';

const TableHeader: FunctionComponent<{
    search?: (value: string) => void
    dictionary: Record<string, string>
    children?: ReactNode
    title?: string
    searchPlaceholder?: string
}> = ({
    search,
    dictionary,
    children,
    title,
    searchPlaceholder
}) => {

        return (
            <div className="px-4 rounded-t-lg bg-neutral-50 dark:bg-darkmode-table-darker border-b dark:border-neutral-700">
                {title && <div className="flex items-center justify-between space-x-4 pt-3">
                    <div className="flex flex-1 items-center space-x-3">
                        <h5 className="font-semibold dark:text-white">{t(dictionary, title)}</h5>
                    </div>
                </div>}
                <div className="flex flex-col-reverse items-start justify-between py-3 md:flex-row md:space-x-4">
                    {search ? <div className="flex w-auto flex-col space-y-3 md:flex-row md:items-center md:space-y-0 lg:w-2/3">
                        <div className="w-auto flex-1 md:mr-4 md:max-w-sm">
                            <Label

                                htmlFor="default-search"
                                className="sr-only text-sm font-medium text-gray-900 dark:text-white"
                            >
                                {t(dictionary, 'shared:search')}
                            </Label>
                            <SearchInput
                                search={search}
                                label={t(dictionary, 'shared:search')}
                                placeholder={searchPlaceholder
                                    ? t(dictionary, searchPlaceholder)
                                    : t(dictionary, 'shared:search')}
                            />
                        </div>

                    </div> : <div></div>}
                    {children && <div className="mb-3 flex w-auto shrink-0 flex-col items-start justify-end md:mb-0 md:w-auto md:flex-row md:items-center md:space-x-3">
                        {children}
                    </div>}
                </div>
            </div>
        )

    };

export default TableHeader;