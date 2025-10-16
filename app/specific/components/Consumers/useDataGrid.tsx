import { RoleType } from '@prisma/client';
import HighlightText from '@root/app/_components/Table/HighlightText';
import SkeletonCell from '@root/app/_components/Table/SkeletonCell';
import Checkbox from '@root/app/_components/ui/Inputs/Checkbox';
import CopyLink from '@root/app/specific/components/Consumers/CopyLink';
import { type ConsumerCustomTable } from '@root/types/specific';
import { format } from 'date-fns-tz';

const useConsumersDataGrid = ({
    rows,
    idsChecked,
    toggleCheck,
    searchValue,
    limit,
    totalCount,
    columns,
    userRole
}: {
    rows: ConsumerCustomTable[]
    idsChecked: string[]
    toggleCheck: (id: string) => void
    searchValue: string,
    limit: number,

    totalCount: number,
    columns: { key: string }[],
    userRole?: RoleType
}) => {

    const showCheckboxes = userRole === RoleType.dietician || userRole === RoleType.manager;

    const skeletonRowsCount = limit > totalCount ? totalCount : limit
    const skeleton = Array.from({ length: skeletonRowsCount }, (_, i) => {
        const checkbox = {
            component: <Checkbox
                id="checkbox-table-search-1"
                name="checkbox-table-search-1"
                checked={false}
                skeleton
                onChange={() => { return void 0 }}
            />,
            className: "p-4 w-6"
        };
        return {
            key: `skeleton-${i}`,
            rows: [
                ...(showCheckboxes ? [checkbox] : []),
                ...columns.map(({ key }) => {
                    return {
                        component: <SkeletonCell />,
                        key
                    }
                })
            ]
        }
    })

    const table = rows.map(({ id, name, code, client, diet, createdAt, dietician, deactivated }, i) => {
        const checkboxes = {
            component: <Checkbox
                id="checkbox-table-search-1"
                name="checkbox-table-search-1"
                checked={idsChecked.includes(id)}
                onChange={() => toggleCheck(id)}
            />,
            className: "p-4 w-6"
        }
        return {
            key: id ?? `placeholderData-${i}`,
            className: deactivated ? 'opacity-50 line-through italic' : '',
            blockClick: deactivated,
            rows: [
                ...(showCheckboxes ? [checkboxes] : []),
                {
                    component: <HighlightText
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                        text={code?.toString() ?? ""}
                        fragment={searchValue} />,
                    key: 'code'
                },
                {
                    component: <HighlightText
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                        text={name ?? ""}
                        fragment={searchValue} />,
                    key: 'name'
                },
                {
                    component: <HighlightText
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                        text={diet?.code?.toString() ?? ""}
                        fragment={searchValue} />,
                    key: 'diet.code'
                },
                {
                    component: <HighlightText
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                        text={diet?.description ?? ""}
                        fragment={searchValue}
                        limit={25}
                    />,
                    key: 'diet.description'
                },
                {
                    component: <HighlightText
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                        text={dietician?.name ?? ""}
                        fragment={searchValue} />,
                    key: 'dietician.name'
                },
                {
                    component: <HighlightText
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                        text={client?.name ?? ""}
                        fragment={searchValue} />,
                    key: 'client.name'
                },
                {
                    component: <HighlightText
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                        text={client?.code?.toString() ?? ""}
                        fragment={searchValue} />,
                    key: 'client.code'
                },
                {
                    component: <CopyLink id={id} disabled={deactivated} />,
                    key: 'linkCopy'
                },
                {
                    component: <HighlightText
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                        text={createdAt?.$date ? format(createdAt.$date, 'dd-MM-yyyy HH:mm') : ''}
                        fragment={searchValue} />,
                    key: 'createdAt'
                },
            ]
        }
    });

    return { skeleton, table }

}

export default useConsumersDataGrid;