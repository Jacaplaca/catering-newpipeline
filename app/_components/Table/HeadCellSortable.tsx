import Tooltip from '@root/app/_components/ui/Tooltip';
import { type TableColumnType } from '@root/types';
import { Table } from 'flowbite-react';
import { type FunctionComponent } from 'react';

const Sort: FunctionComponent<{
    name: string,
    sortName?: string,
    sortDirection?: 'asc' | 'desc'
}> = ({ name, sortName, sortDirection }) => {
    if (name === sortName && sortDirection) {
        return (
            <div className=''>
                <i className={`fa-duotone fa-sort ${sortDirection === 'asc' ? 'rotate-180' : "rotate-0"}`} />
            </div>
        )
    }
    return <i className={`fa-solid fa-sort opacity-70`} />
};

const HeadCellSortable: FunctionComponent<{
    children: React.ReactNode
    sort?: (by: string) => void
    name: string
    sortName?: string
    sortDirection?: 'asc' | 'desc',
    align?: 'left' | 'center' | 'right',
    special?: TableColumnType['special'],
    rowSpan?: number,
    colSpan?: number,
    tooltip?: string
}> = ({
    children,
    sort,
    name,
    sortName,
    sortDirection,
    align,
    special,
    rowSpan,
    colSpan,
    tooltip
}) => {
        return (
            <Table.HeadCell
                rowSpan={rowSpan}
                colSpan={colSpan}
                scope="col"
                className={`px-2 py-1 sm:px-4 sm:py-3  ${sort ? 'cursor-pointer' : ''}`}
                onClick={() => sort && sort(name)}>
                <div className={`flex items-center ${align ? `justify-${align}` : ''}`}>
                    <Tooltip content={tooltip}>
                        <span className="flex flex-col sm:flex-row items-center gap-1">
                            {special?.icon && <Tooltip content={special.tooltip}>
                                <button
                                    className={`p-2 flex items-center opacity-80 hover:opacity-100`}
                                    onClick={special.action}
                                >
                                    <i className={special.icon}></i>
                                </button>
                            </Tooltip>}
                            {children}
                            {sort ? <Sort
                                name={name}
                                sortName={sortName}
                                sortDirection={sortDirection}
                            /> : null}
                        </span>
                    </Tooltip>
                </div>
            </Table.HeadCell>
        )
    }

export default HeadCellSortable