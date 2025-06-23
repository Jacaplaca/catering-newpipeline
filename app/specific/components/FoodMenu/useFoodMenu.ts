import useDay from './useDay';
import useStandardMenu from '@root/app/specific/components/FoodMenu/useStandardMenu';
import { useEffect, useState } from 'react';
import useMenuQueries from './useMenuQueries';
import { type SettingParsedType } from '@root/types';
import useMealQueries from '@root/app/hooks/calls/useMealQueries';
import useMessage from '@root/app/hooks/useMessage';
import useConsumerDietsRow from '@root/app/specific/components/FoodMenu/useRow';
import { api } from '@root/app/trpc/react';
import useRemoveMenu from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/useRemove';
import useToggleMenuForConsumers from '@root/app/specific/components/FoodMenu/ConsumerDiets/useToggleMenuForConsumers';
import useToggleEditable4Client from '@root/app/specific/components/FoodMenu/ConsumerDiets/useToggleEditable4Client';
import useToggleMenuStandard from '@root/app/specific/components/FoodMenu/useToggleMenuStandard';

const useFoodMenu = ({
    lang,
    pageName,
    settings,
    dictionary,
}: {
    lang: LocaleApp,
    pageName: string,
    settings: { main: SettingParsedType },
    dictionary: Record<string, string>,
}) => {
    const utils = api.useUtils();
    const day = useDay();
    const { data: meals } = useMealQueries();
    const [templateDayObject, setTemplateDayObject] = useState<{ id: string, name: string } | null>(null);

    const { messageObj, resetMessage, updateMessage } = useMessage(dictionary);
    const rowClick = useConsumerDietsRow({ updateMessage, resetMessage, day: day.day });

    const clientId = rowClick.expandedRowId ?? '';

    const { showMenuForConsumers, handleShowMenuForConsumers } = useToggleMenuForConsumers({ day: day.day, onRowClick: rowClick.onRowClick });
    const { isMenuEditableForClient, setNotEditable4Client, setEditable4Client } = useToggleEditable4Client();
    const { isStandardMenuCreatorShown, toggleStandardMenuCreator } = useToggleMenuStandard({ clientId, day: day.day, isMenuEditableForClient });

    const menuQueries = useMenuQueries(day.day, templateDayObject, clientId);
    const removeByClient = useRemoveMenu({
        clientId,
        day: day.day ?? { year: 0, month: 0, day: 0 },
        onSuccess: () => {
            setNotEditable4Client();
            void menuQueries.currentClient.refetch();
            void utils.specific.consumerFood.getByClientId.invalidate({
                clientId,
                day: day.day ?? { year: 0, month: 0, day: 0 },
            });
            void utils.specific.regularMenu.getClientsWithCommonAllergens.invalidate();
        },
    });

    // const removeByClientMutation = api.specific.regularMenu.removeByClient.useMutation({
    //     onSuccess: () => {
    //         void menuQueries.currentClient.refetch();
    //         void utils.specific.consumerFood.getByClientId.invalidate({
    //             clientId: rowClick.expandedRowId ?? '',
    //             day: day.day ?? { year: 0, month: 0, day: 0 },
    //         });
    //     },
    // });

    const getConfirmationData = () => {
        return removeByClient;
    }

    const toggleMenuEditableForClient = () => {
        if (isMenuEditableForClient) {
            // removeByClientMutation.mutate({
            //     clientId: rowClick.expandedRowId ?? '',
            //     day: day.day ?? { year: 0, month: 0, day: 0 },
            // });
            removeByClient.show();
            // void utils.specific.regularMenu.getClientsWithCommonAllergens.invalidate();

        } else {
            setEditable4Client();
        }

    }

    useEffect(() => {
        if (clientId) {
            setNotEditable4Client();
            void utils.specific.regularMenu.getOne.invalidate();
        }
    }, [clientId]);


    useEffect(() => {
        if (menuQueries.currentClient.data && clientId) {
            setEditable4Client();
        }
    }, [menuQueries.currentClient.data, clientId]);

    const standardMenuForm = useStandardMenu({
        day: day.day,
        menuQueries,
        setTemplateDayObject,
        clientId: (menuQueries.currentClient.data ?? clientId) ? clientId : undefined,
    });

    const getFoodsByMealId = (mealId: string) => {
        const foods = standardMenuForm.form.watch('foods');
        return foods?.filter(item => item?.mealId === mealId) ?? [];
    }

    const getAllergens = (mealId: string) => {
        const foods = standardMenuForm.form.watch('foods');
        const filteredFoods = (foods ?? []).filter(item => item?.mealId === mealId);
        const allAllergensOfMeal = filteredFoods.flatMap(item => item?.allergens ?? []);
        return Array.from(new Map(allAllergensOfMeal.map(allergen => [allergen.id, allergen])).values());
    }

    const getAllAllergensFromAllTypes = () => {
        const foods = standardMenuForm.form.watch('foods');
        if (!foods) {
            return [];
        }
        const allAllergens = foods.flatMap(item => item?.allergens ?? []);
        return Array.from(new Map(allAllergens.map(allergen => [allergen.id, allergen])).values());
    }

    const checkIfFormNotEmpty = () => {
        const foods = standardMenuForm.form.watch('foods');
        if (!foods) {
            return false;
        }
        return foods.length > 0;
    };

    return {
        pageName,
        lang,
        dictionary,
        day,
        standardMenuForm,
        menuQueries,
        templateDayObject,
        getAllergens,
        getAllAllergensFromAllTypes,
        isMenuEdited: !!standardMenuForm.form.formState.dirtyFields.foods,
        checkIfFormNotEmpty,
        settings,
        isFormNotEmpty: checkIfFormNotEmpty(),
        meals,
        getFoodsByMealId,
        rowClick,
        message: { messageObj, resetMessage, updateMessage },
        isMenuEditableForClient,
        toggleMenuEditableForClient,
        getConfirmationData,
        showMenuForConsumers,
        handleShowMenuForConsumers,
        isStandardMenuCreatorShown,
        toggleStandardMenuCreator,
    }
};
export default useFoodMenu;