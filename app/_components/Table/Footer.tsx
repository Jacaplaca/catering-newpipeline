import Dropdown from '@root/app/_components/ui/Inputs/Dropdown';
import getPagination from '@root/app/lib/getPagination';
import translate from '@root/app/lib/lang/translate';
import makeHref from '@root/app/lib/url/makeHref';
import { Label, Pagination } from "flowbite-react";
import { useRouter, useSearchParams } from 'next/navigation';
import { type FunctionComponent, useCallback } from "react";

const paginationTheme = {
    base: "",
    layout: {
        table: {
            base: "text-sm text-neutral-700 dark:text-neutral-400",
            span: "font-semibold text-neutral-900 dark:text-white"
        }
    },
    pages: {
        base: "xs:mt-0 mt-2 inline-flex items-center -space-x-px",
        showIcon: "inline-flex",
        previous: {
            base: `ml-0 rounded-l-lg px-3 py-2
            leading-tight enabled:hover:bg-neutral-100 enabled:hover:text-neutral-700
            border border-neutral-300 dark:border-neutral-700
            bg-white dark:bg-neutral-800
            text-neutral-500 dark:text-neutral-400
            enabled:dark:hover:bg-neutral-700 enabled:dark:hover:text-white`,
            icon: "h-5 w-5"
        },
        next: {
            base: "rounded-r-lg border border-neutral-300 bg-white px-3 py-2 leading-tight text-neutral-500 enabled:hover:bg-neutral-100 enabled:hover:text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 enabled:dark:hover:bg-neutral-700 enabled:dark:hover:text-white",
            icon: "h-5 w-5"
        },
        selector: {
            base: `w-12 border border-neutral-300 bg-white
            py-2 leading-tight text-neutral-500
            enabled:hover:bg-neutral-100 enabled:hover:text-neutral-700
            dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400
            enabled:dark:hover:bg-neutral-700 enabled:dark:hover:text-white
            w-9 py-2 text-sm
            `,
            active: `bg-neutral-100 dark:bg-neutral-700
            text-neutral-600 dark:text-white hover:text-red-700
            dark:border-neutral-700`,
            disabled: "cursor-not-allowed opacity-50"
        }
    }
}

const TableFooter: FunctionComponent<{
    totalCount: number
    pageName: string
    lang: LocaleApp
    dictionary: Record<string, string>
    isLoading?: boolean
}> = ({
    totalCount,
    pageName,
    lang,
    dictionary,
    isLoading
}) => {

        const router = useRouter();
        const searchParams = useSearchParams()
        const {
            page: currentPage,
            limit,
            totalPages,
            firstElement,
            lastElement,
        } = getPagination(new URLSearchParams(searchParams.toString()), totalCount);

        const makePaginationUrl = useCallback(
            (name: string, value: string) => {
                const params = new URLSearchParams(searchParams.toString())
                params.set(name, value);
                if (name === 'limit') {
                    params.set('page', '1');
                }
                return makeHref({ lang, page: pageName, slugs: [], params }, true);
            },
            [lang, pageName, searchParams]
        )

        const onChangeLimit = (value: string) => {
            const url = makePaginationUrl("limit", value);
            router.push(url);
        }

        const onChangePage = (value: number) => {
            const url = makePaginationUrl("page", value.toString());
            router.push(url);
        };

        const limits = [10, 20, 50, 100].map((value) => ({ label: value.toString(), value: value.toString() }));
        return (
            <div className={`relative rounded-b-lg bg-neutral-50 shadow-md dark:bg-darkmode-table-darker
        border-t border-neutral-100 dark:border-neutral-700
        `}>
                <div className="flex flex-col items-start justify-between space-y-2 sm:space-y-3 p-2 sm:p-4 md:flex-row md:items-center md:space-y-0">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <Label
                            htmlFor="rows"
                            className="text-sm font-normal text-neutral-500 dark:text-neutral-400"
                        >
                            {translate(dictionary, "shared:per_page")}
                        </Label>
                        {isLoading ? <i className={`my-4 animate-spin fas fa-spinner`} /> : <Dropdown
                            onChange={onChangeLimit}
                            options={limits}
                            value={limit.toString()}
                            styles={{
                                control:
                                {
                                    width: '70px',
                                }
                            }}
                        />}
                        {isLoading ? null : <div className="text-xs font-normal text-neutral-500 dark:text-neutral-400">
                            <span className="font-semibold text-neutral-900 dark:text-white">
                                {firstElement}-{lastElement}
                            </span>
                            &nbsp;{translate(dictionary, 'shared:of')}&nbsp;
                            <span className="font-semibold text-neutral-900 dark:text-white">
                                {totalCount}
                            </span>
                        </div>}
                    </div>
                    {isLoading || totalPages <= 0 ? null : <Pagination
                        currentPage={currentPage}
                        nextLabel=""
                        onPageChange={onChangePage}
                        previousLabel=""
                        showIcons
                        totalPages={totalPages}
                        theme={paginationTheme}
                    />}
                </div>
            </div>
        );
    }

export default TableFooter;