import HighlightText from '@root/app/_components/Table/HighlightText';
import SkeletonCell from '@root/app/_components/Table/SkeletonCell';
import translate from '@root/app/lib/lang/translate';
import Property from '@root/app/specific/components/FoodMenu/ConsumerDiets/Poperties';
import { type ClientWithCommonAllergens } from '@root/types/specific';
import { env } from '@root/app/env';
import DayMenuPdf from '@root/app/specific/components/FoodMenu/ConsumerDiets/DayMenuPdf';

const useConsumerDietsDataGrid = ({
    rows,
    searchValue,
    limit,
    totalCount,
    columns,
    dictionary
}: {
    rows: ClientWithCommonAllergens[]
    searchValue: string,
    limit: number,
    totalCount: number,
    columns: { key: string }[]
    dictionary: Record<string, string>
}) => {

    const skeletonRowsCount = limit > totalCount ? totalCount : limit
    const skeleton = Array.from({ length: skeletonRowsCount }, (_, i) => {
        return {
            key: `skeleton-${i}`,
            rows: [
                ...columns.map(({ key }) => {
                    return {
                        component: <SkeletonCell />,
                        key
                    }
                })
            ]
        }
    })

    const table = rows.map((row, i) => {
        const { id, info, deactivated, hasCommonAllergens, hasIndividualMenu } = row;
        const name = env.NEXT_PUBLIC_MENU_FRONT ? `${info?.name} ${id}` : info?.name;
        return {
            key: id ?? `placeholderData-${i}`,
            className: deactivated ? 'opacity-80 bg-clip-content h-[40px] bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(0,0,0,0.4)_8px,rgba(0,0,0,0.7)_16px)]' : '',
            rows: [
                {
                    component: <HighlightText
                        text={info?.code ?? ""}
                        fragment={searchValue} />,
                    key: 'info.code',
                    className: 'w-[100px]'
                },
                {
                    component: <HighlightText
                        className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                        text={name ?? ""}
                        fragment={searchValue} />,
                    key: 'info.name'
                },
                {
                    component: <DayMenuPdf clientId={id} />,
                    key: 'clientDayMenuPdf'
                },
                {
                    component: <div className='flex gap-2 items-center justify-start'>
                        <Property value={hasCommonAllergens}
                            trueColor="text-red-500"
                            trueIcon="fa fa-triangle-exclamation"
                            falseIcon="fa fa-badge-check"
                            falseColor="text-green-500"
                            label={hasCommonAllergens ? translate(dictionary, 'menu-creator:common_allergens') : ''}
                        />
                        <Property value={hasIndividualMenu}
                            trueColor="text-blue-500"
                            trueIcon="fa fa-palette"
                            falseIcon=""
                            label={hasIndividualMenu ? translate(dictionary, 'menu-creator:individual_menu') : ''}
                        />
                        {/* <Property value={hasIndividualMenu} label={t('clients:individual_menu')} icon="fa fa-user" /> */}
                    </div>,
                    key: 'properties'
                },
                // {
                //     component: <HighlightText
                //         className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                //         text={name ?? ""}
                //         fragment={searchValue} />,
                //     key: 'name'
                // },
                // {
                //     component: <HighlightText
                //         className="whitespace-nowrap font-medium text-gray-900 dark:text-white"
                //         text={email ?? ""}
                //         fragment={searchValue} />,
                //     key: 'email'
                // },
                // {
                //     component: <HighlightText
                //         text={info?.email}
                //         fragment={searchValue} />,
                //     key: 'info.email'
                // },
                // {
                //     component: <HighlightText
                //         text={info?.phone}
                //         fragment={searchValue} />,
                //     key: 'info.phone'
                // },
                // {
                //     component: <HighlightText
                //         text={info?.address}
                //         fragment={searchValue} />,
                //     key: 'info.address'
                // },
                // {
                //     component: <HighlightText
                //         text={info?.city}
                //         fragment={searchValue} />,
                //     key: 'info.city'
                // },
                // {
                //     component: <HighlightText
                //         text={info?.zip}
                //         fragment={searchValue} />,
                //     key: 'info.zip'
                // },
                // {
                //     component: <HighlightText
                //         text={info?.contactPerson}
                //         fragment={searchValue} />,
                //     key: 'info.contactPerson'
                // },
                // {
                //     component: <HighlightText
                //         text={info?.country}
                //         fragment={searchValue} />,
                //     key: 'info.country'
                // },
                // {
                //     component: <HighlightText
                //         text={deliveryRoute?.code}
                //     // fragment={searchValue} 
                //     />,
                //     key: 'deliveryRoute.code'
                // },
                // {
                //     component: <HighlightText
                //         text={info?.firstOrderDeadline}
                //         fragment={searchValue} />,
                //     key: 'info.firstOrderDeadline'
                // },
                // {
                //     component: <HighlightText
                //         text={info?.secondOrderDeadline}
                //         fragment={searchValue} />,
                //     key: 'info.secondOrderDeadline'
                // },

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

export default useConsumerDietsDataGrid;