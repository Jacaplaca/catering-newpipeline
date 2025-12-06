
import { TableRow, TableCell } from 'flowbite-react';
import { type FunctionComponent } from 'react';

const ExpandedRow: FunctionComponent<{
    rowClassName?: string;
    cellClassName?: string;
    children?: React.ReactNode;
    colSpan?: number;
}> = ({
    rowClassName,
    cellClassName,
    children,
    colSpan = 20
}) => {

        return (
            <TableRow
                className={` flex-1 overflow-x-auto
            bg-neutral-50 dark:bg-neutral-800
            hover:bg-neutral-50 hover:dark:bg-neutral-800
            border-transparent dark:border-transparent
            ${rowClassName ?? ''}
            `}
                id="table-column-body-4"
                aria-labelledby="table-column-header-4"
            >
                <TableCell
                    className={`p-4 ${cellClassName ?? ''}`}
                    colSpan={colSpan}
                > {children}
                </TableCell>
            </TableRow>
        );
    }


export default ExpandedRow;