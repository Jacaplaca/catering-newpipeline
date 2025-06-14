import HighlightText from '@root/app/_components/Table/HighlightText';
import SkeletonCell from '@root/app/_components/Table/SkeletonCell';
import YesNo from '@root/app/_components/Table/YesNo';
import Checkbox from '@root/app/_components/ui/Inputs/Checkbox';
import { type ClientCustomTable } from '@root/types/specific';

const useClientDataGrid = ({
    rows,
    idsChecked,
    toggleCheck,
    searchValue,
    limit,
    totalCount,
    columns,
}: {
    rows: ClientCustomTable[]
    idsChecked: string[]
    toggleCheck: (id: string) => void
    searchValue: string,
    limit: number,
    totalCount: number,
    columns: { key: string }[]
}) => {

    const skeletonRowsCount = limit > totalCount ? totalCount : limit
    const skeleton = Array.from({ length: skeletonRowsCount }, (_, i) => {
        return {
            key: `skeleton-${i}`,
            rows: [
                {
                    component: <Checkbox
                        id="checkbox-table-search-1"
                        name="checkbox-table-search-1"
                        checked={false}
                        skeleton
                        onChange={() => { return void 0 }}
                    />,
                    className: "p-4 w-6"
                },
                ...columns.map(({ key }) => {
                    return {
                        component: <SkeletonCell />,
                        key
                    }
                })
            ]
        }
    })

    const table = rows.map(({ id, name, info, email, deactivated, deliveryRoute }, i) => {
        return {
            key: id ?? `placeholderData-${i}`,
            className: deactivated ? 'opacity-80 bg-clip-content h-[40px] bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(0,0,0,0.4)_8px,rgba(0,0,0,0.7)_16px)]' : '',
            rows: [
                {
                    component: <Checkbox
                        id="checkbox-table-search-1"
                        name="checkbox-table-search-1"
                        checked={idsChecked.includes(id)}
                        onChange={() => toggleCheck(id)}
                    />,
                    className: "p-4 w-6"
                },
                {
                    component: <HighlightText
                        text={info?.code ?? ""}
                        fragment={searchValue} />,
                    key: 'info.code'
                },
                {
                    component: <HighlightText
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                        text={info?.name ?? ""}
                        fragment={searchValue} />,
                    key: 'info.name'
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
                        text={email ?? ""}
                        fragment={searchValue} />,
                    key: 'email'
                },
                {
                    component: <HighlightText
                        text={info?.email}
                        fragment={searchValue} />,
                    key: 'info.email'
                },
                {
                    component: <HighlightText
                        text={info?.phone}
                        fragment={searchValue} />,
                    key: 'info.phone'
                },
                {
                    component: <HighlightText
                        text={info?.address}
                        fragment={searchValue} />,
                    key: 'info.address'
                },
                {
                    component: <HighlightText
                        text={info?.city}
                        fragment={searchValue} />,
                    key: 'info.city'
                },
                {
                    component: <HighlightText
                        text={info?.zip}
                        fragment={searchValue} />,
                    key: 'info.zip'
                },
                {
                    component: <HighlightText
                        text={info?.contactPerson}
                        fragment={searchValue} />,
                    key: 'info.contactPerson'
                },
                {
                    component: <HighlightText
                        text={info?.country}
                        fragment={searchValue} />,
                    key: 'info.country'
                },
                {
                    component: <HighlightText
                        text={deliveryRoute?.code}
                    // fragment={searchValue} 
                    />,
                    key: 'deliveryRoute.code'
                },
                {
                    component: <HighlightText
                        text={info?.firstOrderDeadline}
                        fragment={searchValue} />,
                    key: 'info.firstOrderDeadline'
                },
                {
                    component: <HighlightText
                        text={info?.secondOrderDeadline}
                        fragment={searchValue} />,
                    key: 'info.secondOrderDeadline'
                },
                {
                    component: <YesNo value={info?.allowWeekendOrder ?? false} />,
                    key: 'info.allowWeekendOrder'
                },
                // {
                //     component: settings?.lastOrderTime
                //         ? <div className='flex gap-2 items-center justify-start'>
                //             <i className="text-gray-500 dark:text-gray-400 fa fa-clock" />
                //             <HighlightText
                //                 text={settings?.lastOrderTime}
                //                 fragment={searchValue} />
                //         </div> : null,
                //     key: 'settings.lastOrderTime'
                // },
            ]
        }
    });

    return { skeleton, table }

}

export default useClientDataGrid;