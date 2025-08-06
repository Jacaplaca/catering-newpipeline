import ExpandedRow from '@root/app/_components/Table/ExpandedRow';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import TableMealClients from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/TableMealClients';
import StandardMenuCreator from '@root/app/specific/components/FoodMenu/StandardMenuCreator';
import Switch4ClientStandardEdit from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/Switch4ClientStandardEdit';
import { useConsumerDietsTableContext } from '@root/app/specific/components/FoodMenu/ConsumerDiets/context';
import translate from '@root/app/lib/lang/translate';

const ConsumerDietsExpandedRow = () => {
    const { isStandardMenuCreatorShown, rowClick: { expandedRowId } } = useFoodMenuContext();
    const { dictionary, filter: { allergens } } = useConsumerDietsTableContext();

    return (<ExpandedRow>
        <div className='relative'>
            <div className='flex items-center gap-2 justify-between'>
                <Switch4ClientStandardEdit />
                {allergens.length > 0 && <div className="text-neutral-600 dark:text-neutral-300">{translate(dictionary, 'menu-creator:showing_consumers_with_allergens')} {allergens.map(a => a.name).join(', ')}</div>}
            </div>
            {isStandardMenuCreatorShown
                ? <StandardMenuCreator clientId={expandedRowId} />
                : <TableMealClients />}
        </div>
    </ExpandedRow>

    );
}


export default ConsumerDietsExpandedRow;