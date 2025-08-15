import HeadCellSortable from '@root/app/_components/Table/HeadCellSortable';
import Checkbox from '@root/app/_components/ui/Inputs/Checkbox';
import translate from '@root/app/lib/lang/translate';
import { type TableColumnType } from '@root/types';
import { Label, Table } from 'flowbite-react';
import { type FunctionComponent } from 'react';

const TableColumns: FunctionComponent<{
    columns: TableColumnType[],
    check?: () => void;
    isCheck?: boolean;
    sortName?: string;
    sortDirection?: 'asc' | 'desc';
    show?: string[];
    dictionary: Record<string, string>;
    hideCheck?: boolean;
}> = ({
    columns,
    check,
    isCheck = false,
    sortName,
    sortDirection,
    show,
    dictionary,
    hideCheck
}) => {
        const filter = ({ key }: { key?: string }) => {
            if (!show || !key) return true;
            return show.includes(key);
        };
        // Create structured data for headers
        const headerStructure: Array<{
            isGroup: boolean;
            parentKey?: string;
            parentTitle?: string | string[];
            parentAlign?: 'left' | 'center' | 'right';
            parentSort?: (by: string) => void;
            parentSpecial?: TableColumnType['special'];
            colSpan: number;
            tooltip?: string;
            children: Array<{
                key: string;
                title: string | string[];
                sort?: (by: string) => void;
                align?: 'left' | 'center' | 'right';
                special?: TableColumnType['special'];
                tooltip?: string
            }>;
        }> = [];

        columns.filter(filter).forEach(column => {
            if (column.children && column.children.length > 0) {
                // Add grouped column
                headerStructure.push({
                    isGroup: true,
                    parentKey: column.key,
                    parentTitle: column.title,
                    parentAlign: column.align,
                    parentSort: column.sort,
                    parentSpecial: column.special,
                    colSpan: column.children.length,
                    tooltip: column.tooltip,
                    children: column.children.map(child => ({
                        key: child.key,
                        title: child.title,
                        sort: child.sort,
                        align: child.align,
                        special: child.special,
                        tooltip: child.tooltip
                    }))
                });
            } else {
                // Add standalone column
                headerStructure.push({
                    isGroup: false,
                    colSpan: 1,
                    tooltip: column.tooltip,
                    children: [{
                        key: column.key,
                        title: column.title,
                        sort: column.sort,
                        align: column.align,
                        special: column.special,
                        tooltip: column.tooltip
                    }]
                });
            }
        });

        // Check if we have any grouped columns
        const hasGroupedColumns = headerStructure.some(item => item.isGroup);

        if (!hasGroupedColumns) {
            // Simple single row header when no children exist
            return (
                <Table.Head className="">
                    {check && (
                        <Table.HeadCell scope="col" className="px-4 py-3">
                            {!hideCheck && <div className="flex items-center">
                                <Checkbox
                                    id="checkbox-all"
                                    name="checkbox-all"
                                    size={'md'}
                                    onChange={check}
                                    checked={isCheck}
                                />
                                <Label htmlFor="checkbox-all" className="sr-only">
                                    Check all
                                </Label>
                            </div>}
                        </Table.HeadCell>
                    )}
                    {headerStructure.map((item) =>
                        item.children.map(({ key, title, sort, align, special, tooltip }) => (
                            <HeadCellSortable
                                key={key}
                                name={key}
                                sort={sort}
                                sortName={sortName}
                                sortDirection={sortDirection}
                                align={align}
                                special={special}
                                tooltip={tooltip}
                            >
                                {translate(dictionary, title)}
                            </HeadCellSortable>
                        ))
                    ).flat()}
                </Table.Head>
            );
        }

        return (
            <>
                <Table.Head className="">
                    {check && (
                        <Table.HeadCell scope="col" className="px-4 py-3" rowSpan={2}>
                            {!hideCheck && <div className="flex items-center">
                                <Checkbox
                                    id="checkbox-all"
                                    name="checkbox-all"
                                    size={'md'}
                                    onChange={check}
                                    checked={isCheck}
                                />
                                <Label htmlFor="checkbox-all" className="sr-only">
                                    Check all
                                </Label>
                            </div>}
                        </Table.HeadCell>
                    )}
                    {/* First row - parent headers and standalone columns */}
                    {headerStructure.map((item) => {
                        if (item.isGroup) {
                            // Group parent header
                            return (
                                <HeadCellSortable
                                    key={item.parentKey}
                                    name={item.parentKey ?? ''}
                                    sort={item.parentSort}
                                    sortName={sortName}
                                    sortDirection={sortDirection}
                                    align={item.parentAlign}
                                    special={item.parentSpecial}
                                    colSpan={item.colSpan}
                                    rowSpan={1}
                                    tooltip={item.tooltip}
                                >
                                    {translate(dictionary, item.parentTitle)}
                                </HeadCellSortable>
                            );
                        } else {
                            // Standalone column
                            const child = item.children[0];
                            if (!child) return null;
                            return (
                                <HeadCellSortable
                                    key={child.key}
                                    name={child.key}
                                    sort={child.sort}
                                    sortName={sortName}
                                    sortDirection={sortDirection}
                                    align={child.align}
                                    special={child.special}
                                    rowSpan={2}
                                    tooltip={item.tooltip}
                                >
                                    {translate(dictionary, child.title)}
                                </HeadCellSortable>
                            );
                        }
                    })}
                </Table.Head>
                <Table.Head>
                    {/* Second row - child headers only, in the correct order */}
                    {headerStructure.map((item) => {
                        if (item.isGroup) {
                            return item.children.map(({ key, title, sort, align, special }) => (
                                <HeadCellSortable
                                    key={key}
                                    name={key}
                                    sort={sort}
                                    sortName={sortName}
                                    sortDirection={sortDirection}
                                    align={align}
                                    special={special}
                                >
                                    {translate(dictionary, title)}
                                </HeadCellSortable>
                            ));
                        }
                        // For standalone columns, return empty array as they have rowSpan={2}
                        return [];
                    }).flat()}
                </Table.Head>
            </>
        )
    }

export default TableColumns;