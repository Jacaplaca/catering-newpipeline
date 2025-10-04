import MainModal from '@root/app/_components/Modals/MainModal';
import RowActions from '@root/app/_components/Table/Actions';
import translate from '@root/app/lib/lang/translate';
import usePublishMenu from '@root/app/specific/components/FoodMenu/ConsumerDiets/usePublishMenu';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import { type FC } from 'react';

const WithAllergens: FC<{ data: { id: string, name: string | null, code: string | null }[] }> = ({ data }) => {
    const { dictionary } = useFoodMenuContext();

    if (data && data.length > 0) {
        return (
            <div>
                <div>{translate(dictionary, 'menu-creator:cant_publish_menu')}</div>
                <div>{data?.map((client) => (
                    <div key={client.id}>{client.name}</div>
                ))}</div>
            </div>
        )
    }
    return null;

}

const ContextMenuForMenuCreator: FC = () => {
    const { dictionary } = useFoodMenuContext();
    const { publishMenu, isSuccess, isPending, error, reset, data } = usePublishMenu({ clientId: undefined })
    const showModal = Boolean(isSuccess || isPending || error);

    const actions = [
        {
            label: 'menu-creator:publish',
            onClick: () => {
                void publishMenu();
            },
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
                    <div className="flex justify-center gap-6">
                        {data && data.length === 0 && <div>{translate(dictionary, 'menu-creator:published_menu')}</div>}
                    </div>
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