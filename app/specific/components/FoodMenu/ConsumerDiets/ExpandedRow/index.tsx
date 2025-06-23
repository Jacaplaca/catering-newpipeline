import ExpandedRow from '@root/app/_components/Table/ExpandedRow';
import { useFoodMenuContext } from '@root/app/specific/components/FoodMenu/context';
import TableMealClients from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/TableMealClients';
import StandardMenuCreator from '@root/app/specific/components/FoodMenu/StandardMenuCreator';
import Switch4ClientStandardEdit from '@root/app/specific/components/FoodMenu/ConsumerDiets/ExpandedRow/Switch4ClientStandardEdit';

const ConsumerDietsExpandedRow = () => {
    const { isStandardMenuCreatorShown, rowClick: { expandedRowId } } = useFoodMenuContext();

    return (<ExpandedRow>
        <div className='relative'>
            <Switch4ClientStandardEdit />
            {isStandardMenuCreatorShown
                ? <StandardMenuCreator clientId={expandedRowId} />
                : <TableMealClients />}
        </div>
    </ExpandedRow>

    );
}


export default ConsumerDietsExpandedRow;