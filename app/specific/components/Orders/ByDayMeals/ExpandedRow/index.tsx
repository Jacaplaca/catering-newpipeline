
import ExpandedRow from '@root/app/_components/Table/ExpandedRow';
import { useOrderByDayMealsTableContext } from '@root/app/specific/components/Orders/ByDayMeals/context';
import DietNew from '@root/app/specific/components/Orders/ByDayMeals/ExpandedRow/DietNew';
import SummaryStandard from '@root/app/specific/components/Orders/ByDayMeals/ExpandedRow/SummaryStandard';

const OrderDayExpandedRow = () => {

    const {
        row: { dayId, fetching },
    } = useOrderByDayMealsTableContext();


    const Wrapper = dayId ? ExpandedRow : 'div';

    return (<Wrapper>

        {fetching ? <div className='flex justify-center items-center h-full p-10'><i className='fas fa-spinner fa-spin text-3xl' /></div> : (
            <>
                <SummaryStandard />
                <DietNew />
            </>
        )}


    </Wrapper>
    );
}



export default OrderDayExpandedRow;