import { Label, Radio } from "flowbite-react";
import { type FunctionComponent } from 'react';
import SimpleDropdown from '@root/app/_components/ui/SimpleDropdown';
import { DropdownItem } from 'flowbite-react';
import translate from '@root/app/lib/lang/translate';
import Checkbox from '@root/app/_components/ui/Inputs/Checkbox';
import { type TableColumnType } from '@root/types';

const theme = {
    base: `h-5 w-5 border border-neutral-300 dark:border-neutral-600 dark:bg-neutral-700 focus:ring-1`,
    color: {
        default: 'text-darkmode-secondary focus:ring-secondary dark:ring-offset-gray-800 dark:focus:ring-secondary-accent'
    }
};

const FilterLabel: FunctionComponent<{
    id: string;
    filter: (id: string) => void;
    children: string;
}> = ({ children, id, filter }) => {
    return (
        <div className="mr-4 flex items-center">
            <Radio
                id={id}
                name="show-only"
                onChange={() => filter(id)}
                theme={theme}
                className='cursor-pointer'
            />
            <Label
                htmlFor={id}
                className="ml-2 text-sm font-medium text-neutral-900 dark:text-neutral-300 cursor-pointer"
            >
                {children}
            </Label>
        </div>
    );
}

const ColumnFilter: FunctionComponent<{
    columns: TableColumnType[],
    toggleColumn: (columns: TableColumnType[], key: string) => void,
    label: string;
    checked?: string[];
    dictionary: Record<string, string>;
}> = ({ columns, toggleColumn, label, checked, dictionary }) => {

    return (
        <SimpleDropdown
            label={
                <>
                    <i className="-ml-1 mr-1.5 mt-1 w-5 fa-solid fa-chevron-down"></i>
                    {label}
                </>
            }
            theme={{ arrowIcon: "hidden" }}
        >
            {columns.map(({ key, title }) => {
                return (
                    <DropdownItem
                        key={key}
                        onClick={() => toggleColumn(columns, key)}
                    >
                        <div className='flex gap-2 items-center'>
                            <Checkbox
                                id="checkbox-column"
                                name="checkbox-column"
                                checked={checked ? checked.includes(key) : true}
                                onChange={() => toggleColumn(columns, key)}
                                label={translate(dictionary, title)}
                                labelStyle="py-1"
                            />
                        </div>
                    </DropdownItem>
                );
            })}
        </SimpleDropdown >
    );
}



const QuickFilterRow: FunctionComponent<{
    columns?: TableColumnType[],
    toggleColumn?: (columns: TableColumnType[], key: string) => void,
    checkedColumns?: string[];
    children?: React.ReactNode;
    childrenClassName?: string;
    label?: string;
    labels?: {
        label: string;
        id: string;
        filter: (id: string) => void;
    }[],
    dictionary: Record<string, string>;
}> = ({ children, label, labels, columns, toggleColumn, dictionary, checkedColumns, childrenClassName = "" }) => {
    return (
        <div className="mx-4 flex flex-wrap items-center gap-4">
            <div className='py-4 flex flex-wrap items-center gap-4 w-full'>
                {children && <div className={`mr-4 flex gap-6 items-center ${childrenClassName}`}>
                    {children}
                </div>}
                {label ? <div className="hidden items-center text-sm font-medium text-neutral-900 dark:text-white md:flex">
                    {label}
                </div> : null}
                {labels ? <div className="flex flex-wrap">
                    {labels.map(({ label, id, filter }) => (
                        <FilterLabel key={id} id={id} filter={filter}>
                            {label}
                        </FilterLabel>
                    ))}
                </div> : null}
                <div className="flex-grow"></div>
                <div className="flex items-center">
                    {columns && toggleColumn && <ColumnFilter
                        label={translate(dictionary, "shared:columns_filter")}
                        columns={columns}
                        toggleColumn={toggleColumn}
                        checked={checkedColumns}
                        dictionary={dictionary}
                    />}
                </div>
            </div>
        </div>
    )
};

export default QuickFilterRow;