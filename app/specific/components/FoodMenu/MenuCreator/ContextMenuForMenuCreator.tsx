import MainModal from '@root/app/_components/Modals/MainModal';
import RowActions from '@root/app/_components/Table/Actions';
import Message from '@root/app/_components/ui/form/Message';
import translate from '@root/app/lib/lang/translate';
import usePublishMenu from '@root/app/specific/components/FoodMenu/ConsumerDiets/usePublishMenu';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import { type FC } from 'react';

const WithAllergens: FC<{ data: { id: string, name: string | null, code: string | null }[] }> = ({ data }) => {
    const { dictionary } = useFoodMenuContext();

    if (data && data.length > 0) {
        return (
            <div className="space-y-4">
                <Message
                    message={translate(dictionary, 'menu-creator:cant_publish_menu')}
                    status="warning"
                    // className="mt-6"
                    textSize="lg"
                    show={data && data.length > 0}
                />
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                        {translate(dictionary, 'menu-creator:clients_with_allergens')}:
                    </h4>
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                        {data?.map((client) => (
                            <li
                                key={client.id}
                                className="flex items-center gap-2 p-3 rounded-md bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                                <i className="fas fa-user-circle text-neutral-400 dark:text-neutral-500"></i>
                                <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                                    {client.name}
                                </span>
                                <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                                    ({client.code})
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        )
    }
    return null;

}

const ContextMenuForMenuCreator: FC = () => {
    const { dictionary, menuQueries } = useFoodMenuContext();
    const { publishMenu, isSuccess, isPending, error, reset, data, unpublishMenu, isUnpending } = usePublishMenu({ clientId: undefined })
    const showModal = Boolean(isSuccess || isPending || error);
    const isPublished = menuQueries?.existingMenu?.isPublished;

    const actions = [
        {
            key: 'publish',
            label: 'menu-creator:publish',
            onClick: () => {
                void publishMenu();
            },
            disabled: !!isPublished,
        },
        {
            key: 'unpublish',
            label: 'menu-creator:cancel_publish',
            onClick: () => {
                void unpublishMenu();
            },
            disabled: !isPublished,
        },
    ]

    return (
        <div>
            <MainModal
                isOpen={showModal}
                closeModal={reset}
                header={<div>{translate(dictionary, 'menu-creator:publishing')}</div>}
            >
                {/* {JSON.stringify(data)} */}
                {/* {JSON.stringify(isPending)} */}
                {/* {JSON.stringify(isSuccess)} */}
                {/* {JSON.stringify(error)} */}
                {isPending && (
                    <div className="flex justify-center gap-6">
                        <i className="fas fa-spinner animate-spin text-4xl"></i>
                    </div>
                )}
                {data && <WithAllergens data={data} />}
                {data && (
                    // <div className="flex justify-center gap-6">
                    //     {data && data.length === 0 && <div>{translate(dictionary, 'menu-creator:published_menu')}</div>}
                    // </div>
                    <Message
                        message={translate(dictionary, 'menu-creator:published_menu')}
                        status="success"
                        textSize="lg"
                        show={data && data.length === 0}
                    />
                )}
                {error && (
                    <div className="flex justify-center gap-6">
                        <div>{error}</div>
                    </div>
                )}
            </MainModal>
            <RowActions
                label={translate(dictionary, 'shared:actions')}
                actions={actions}
                dictionary={dictionary}
            />
        </div>
    )
}

export default ContextMenuForMenuCreator;