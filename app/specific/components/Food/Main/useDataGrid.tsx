import FieldMultiple from '@root/app/_components/Table/FieldMultiple';
import HighlightText from '@root/app/_components/Table/HighlightText';
import SkeletonCell from '@root/app/_components/Table/SkeletonCell';
import Checkbox from '@root/app/_components/ui/Inputs/Checkbox';
import { type FoodCustomTable } from '@root/types/specific';

const useFoodDataGrid = ({
    rows,
    idsChecked,
    toggleCheck,
    limit,
    totalCount,
    columns,
}: {
    rows: FoodCustomTable[]
    idsChecked: string[]
    toggleCheck: (id: string) => void
    limit: number,
    totalCount: number,
    columns: { key: string }[],
}) => {

    const showCheckboxes = true;

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

    const table = rows.map(({ id, name, allergens, foodCategory, ingredients }, i) => {
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
            // className: deactivated ? 'opacity-50 line-through italic' : '',
            // blockClick: deactivated,
            rows: [
                ...(showCheckboxes ? [checkboxes] : []),
                {
                    component: <HighlightText
                        className="whitespace-normal font-medium text-gray-900 dark:text-white"
                        text={name ?? ""}
                    // fragment={searchValue}
                    />,
                    key: 'name'
                },
                {
                    component: <FieldMultiple
                        items={allergens}
                    />,
                    key: 'allergens'
                },
                {
                    component: <HighlightText
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                        text={foodCategory?.name ?? ""}
                    // fragment={searchValue}
                    />,
                    key: 'foodCategory'
                },
                {
                    component: <HighlightText
                        className="font-medium text-gray-900 dark:text-white"
                        text={ingredients ?? ""}
                    // fragment={searchValue}
                    />,
                    key: 'ingredients'
                },
            ]
        }
    });

    return { skeleton, table }

}

export default useFoodDataGrid;